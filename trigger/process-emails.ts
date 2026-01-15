import { schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import {
  gmailTokens,
  prompts,
  emailLogs,
  userSkipFilters,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  fetchNewEmails,
  refreshGmailTokens,
  type EmailMessage,
} from "@/lib/gmail";
import { processEmailWithTools, type AIProvider } from "@/lib/ai";
import { executeAllTools } from "@/lib/gmail-tool-executor";
import type { ToolCallResult } from "@/lib/ai-tools";

// Helper to extract domain from email address
function extractDomain(email: string): string | null {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : null;
}

// Helper to extract email address from "Name <email@domain.com>" format
function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase();
}

// Check if email should be skipped based on user's skip filters
async function shouldSkipEmail(
  userId: string,
  fromAddress: string
): Promise<{ skip: boolean; reason?: string }> {
  const filters = await db.query.userSkipFilters.findMany({
    where: eq(userSkipFilters.userId, userId),
  });

  if (filters.length === 0) {
    return { skip: false };
  }

  const email = extractEmailAddress(fromAddress);
  const domain = extractDomain(fromAddress);

  for (const filter of filters) {
    if (filter.filterType === "email" && email === filter.value.toLowerCase()) {
      return { skip: true, reason: `Email address "${filter.value}" is in skip list` };
    }
    if (filter.filterType === "domain" && domain === filter.value.toLowerCase()) {
      return { skip: true, reason: `Domain "${filter.value}" is in skip list` };
    }
  }

  return { skip: false };
}

// Check if email was already processed
async function isEmailProcessed(
  userId: string,
  gmailMessageId: string
): Promise<boolean> {
  const existing = await db.query.emailLogs.findFirst({
    where: and(
      eq(emailLogs.userId, userId),
      eq(emailLogs.gmailMessageId, gmailMessageId)
    ),
  });
  return !!existing;
}

// Process a single user's emails
async function processUserEmails(userId: string, gmailToken: typeof gmailTokens.$inferSelect) {
  const results = {
    processed: 0,
    skipped: 0,
    failed: 0,
    alreadyProcessed: 0,
  };

  // Refresh token if expired
  let accessToken = gmailToken.accessToken;
  if (new Date() >= gmailToken.expiresAt) {
    try {
      const newTokens = await refreshGmailTokens(gmailToken.refreshToken);
      accessToken = newTokens.access_token!;

      await db
        .update(gmailTokens)
        .set({
          accessToken: newTokens.access_token!,
          expiresAt: new Date(newTokens.expiry_date || Date.now() + 3600000),
          updatedAt: new Date(),
        })
        .where(eq(gmailTokens.userId, userId));
    } catch (error) {
      console.error(`Failed to refresh token for user ${userId}:`, error);
      return { ...results, error: "Failed to refresh Gmail token" };
    }
  }

  // Get user's active AND published prompts
  const userPrompts = await db.query.prompts.findMany({
    where: and(
      eq(prompts.userId, userId),
      eq(prompts.isActive, true),
      eq(prompts.isPublished, true)
    ),
  });

  if (userPrompts.length === 0) {
    return { ...results, error: "No active published prompts" };
  }

  // Only process emails received AFTER the account was connected
  // This prevents processing thousands of old unread emails
  const accountConnectedAt = gmailToken.createdAt || new Date();

  // Fetch new emails (up to 20 per cron run, only after account connection)
  let emails: EmailMessage[];
  try {
    emails = await fetchNewEmails(accessToken, 20, {
      afterDate: accountConnectedAt,
      unreadOnly: true,
    });
  } catch (error) {
    console.error(`Failed to fetch emails for user ${userId}:`, error);
    return { ...results, error: "Failed to fetch emails" };
  }

  // Process each email
  for (const email of emails) {
    // Check if already processed
    const alreadyProcessed = await isEmailProcessed(userId, email.id);
    if (alreadyProcessed) {
      results.alreadyProcessed++;
      continue;
    }

    // Check skip filters
    const skipCheck = await shouldSkipEmail(userId, email.from);
    if (skipCheck.skip) {
      // Log as skipped
      await db.insert(emailLogs).values({
        userId,
        gmailMessageId: email.id,
        emailSubject: email.subject,
        emailFrom: email.from,
        emailSnippet: email.snippet,
        status: "skipped",
        error: skipCheck.reason,
        createdAt: new Date(),
      });
      results.skipped++;
      continue;
    }

    // Process with each active prompt
    for (const prompt of userPrompts) {
      try {
        // Get AI response with tool calls
        const aiResult = await processEmailWithTools({
          promptText: prompt.promptText,
          email: {
            id: email.id,
            threadId: email.threadId,
            subject: email.subject,
            from: email.from,
            body: email.body || email.snippet,
          },
          provider: prompt.provider as AIProvider,
          model: prompt.model,
        });

        // Execute tools
        let executedActions: ToolCallResult[] = [];
        if (aiResult.toolCalls.length > 0) {
          executedActions = await executeAllTools(
            aiResult.toolCalls,
            { id: email.id, from: email.from, subject: email.subject },
            accessToken
          );
        }

        // Save to database
        await db.insert(emailLogs).values({
          userId,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailSnippet: email.snippet,
          aiResponse: aiResult.text,
          actionsExecuted: executedActions,
          status: "processed",
          processedAt: new Date(),
        });

        results.processed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await db.insert(emailLogs).values({
          userId,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailSnippet: email.snippet,
          status: "failed",
          error: errorMessage,
        });

        results.failed++;
      }
    }
  }

  return results;
}

// Scheduled task that runs every 10 minutes
export const processEmailsTask = schedules.task({
  id: "process-emails-cron",
  // Run every 10 minutes
  cron: "*/10 * * * *",
  run: async () => {
    console.log("Starting scheduled email processing...");

    // Get all users with Gmail connected
    const usersWithGmail = await db.query.gmailTokens.findMany();

    if (usersWithGmail.length === 0) {
      console.log("No users with Gmail connected");
      return { usersProcessed: 0 };
    }

    const allResults = [];

    for (const gmailToken of usersWithGmail) {
      console.log(`Processing emails for user ${gmailToken.userId}...`);

      const result = await processUserEmails(gmailToken.userId, gmailToken);
      allResults.push({
        userId: gmailToken.userId,
        ...result,
      });

      console.log(`User ${gmailToken.userId} results:`, result);
    }

    console.log("Scheduled email processing complete");

    return {
      usersProcessed: usersWithGmail.length,
      results: allResults,
    };
  },
});
