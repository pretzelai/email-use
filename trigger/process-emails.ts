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

// System labels that don't count as "custom labels"
const SYSTEM_LABELS = new Set([
  "INBOX",
  "UNREAD",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "STARRED",
  "IMPORTANT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

// Check if email should be skipped based on prompt's skip filters
function shouldSkipByPromptFilters(
  email: EmailMessage,
  prompt: {
    skipArchived?: boolean | null;
    skipRead?: boolean | null;
    skipLabeled?: boolean | null;
    skipStarred?: boolean | null;
    skipImportant?: boolean | null;
  }
): { skip: boolean; reason?: string } {
  const labels = email.labelIds || [];

  // Skip archived (not in INBOX)
  if (prompt.skipArchived && !labels.includes("INBOX")) {
    return { skip: true, reason: "Email is archived (not in INBOX)" };
  }

  // Skip read (no UNREAD label)
  if (prompt.skipRead && !labels.includes("UNREAD")) {
    return { skip: true, reason: "Email is already read" };
  }

  // Skip starred
  if (prompt.skipStarred && labels.includes("STARRED")) {
    return { skip: true, reason: "Email is starred" };
  }

  // Skip important
  if (prompt.skipImportant && labels.includes("IMPORTANT")) {
    return { skip: true, reason: "Email is marked as important" };
  }

  // Skip already labeled (has custom labels)
  if (prompt.skipLabeled) {
    const customLabels = labels.filter((l) => !SYSTEM_LABELS.has(l));
    if (customLabels.length > 0) {
      return {
        skip: true,
        reason: `Email already has labels: ${customLabels.join(", ")}`,
      };
    }
  }

  return { skip: false };
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
  const tokenExpired = new Date() >= new Date(gmailToken.expiresAt);

  console.log(`Token status for user ${userId}:`, {
    expired: tokenExpired,
    expiresAt: gmailToken.expiresAt,
    now: new Date().toISOString(),
    hasRefreshToken: !!gmailToken.refreshToken,
    refreshTokenLength: gmailToken.refreshToken?.length,
  });

  if (tokenExpired) {
    try {
      console.log(`Attempting to refresh token for user ${userId}...`);
      const newTokens = await refreshGmailTokens(gmailToken.refreshToken);
      accessToken = newTokens.access_token!;
      console.log(`Token refreshed successfully for user ${userId}`);

      await db
        .update(gmailTokens)
        .set({
          accessToken: newTokens.access_token!,
          expiresAt: new Date(newTokens.expiry_date || Date.now() + 3600000),
          updatedAt: new Date(),
        })
        .where(eq(gmailTokens.userId, userId));
    } catch (error) {
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error(`Failed to refresh token for user ${userId}:`, {
        error: errorDetails,
        stack: error instanceof Error ? error.stack : undefined,
        // Common causes:
        // - "invalid_grant" = refresh token expired/revoked (app in testing mode, user revoked, password changed)
        // - "invalid_client" = OAuth credentials misconfigured
      });

      // If token is invalid, we should mark it so user can re-authenticate
      if (errorDetails.includes("invalid_grant")) {
        console.error(`User ${userId} needs to re-authenticate. Refresh token is no longer valid.`);
      }

      return { ...results, error: `Failed to refresh Gmail token: ${errorDetails}` };
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

  // Fetch new emails (up to 10 per cron run, only after account connection)
  // Note: We fetch all emails (not just unread) since each prompt has its own skip filters
  let emails: EmailMessage[];
  try {
    emails = await fetchNewEmails(accessToken, 10, {
      afterDate: accountConnectedAt,
      unreadOnly: false,
    });
  } catch (error) {
    console.error(`Failed to fetch emails for user ${userId}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
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
      // Check prompt-specific skip filters
      const promptSkipCheck = shouldSkipByPromptFilters(email, prompt);
      if (promptSkipCheck.skip) {
        // Log as skipped for this prompt
        await db.insert(emailLogs).values({
          userId,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailSnippet: email.snippet,
          status: "skipped",
          error: promptSkipCheck.reason,
          createdAt: new Date(),
        });
        results.skipped++;
        continue;
      }

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

        console.error(`Failed to process email "${email.subject}" with prompt "${prompt.name}":`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          emailId: email.id,
          promptId: prompt.id,
          userId,
        });

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
  // Use a larger machine to avoid memory issues
  machine: "medium-1x",
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
