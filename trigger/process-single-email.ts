import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { emailLogs, prompts, userSettings } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { processEmailWithTools, type AIProvider } from "@/lib/ai";
import { executeAllTools } from "@/lib/gmail-tool-executor";
import type { ToolCallResult } from "@/lib/ai-tools";
import type { EmailMessage } from "@/lib/gmail";
import { shouldSkipEmail, shouldSkipByPromptFilters } from "./helpers";

// Payload for the process-single-email task
export interface ProcessEmailPayload {
  userId: string;
  accessToken: string;
  email: EmailMessage;
  promptIds: string[];
  debugMode: boolean;
}

// Process a single email against all specified prompts
export const processSingleEmailTask = task({
  id: "process-single-email",
  // Each email gets its own retry logic
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: ProcessEmailPayload) => {
    const { userId, accessToken, email, promptIds, debugMode } = payload;

    const results = {
      emailId: email.id,
      processed: 0,
      skipped: 0,
      failed: 0,
    };

    console.log(`Processing email "${email.subject}" for user ${userId}`);

    // Check user-level skip filters first
    const skipCheck = await shouldSkipEmail(userId, email.from);
    if (skipCheck.skip) {
      await db.insert(emailLogs).values({
        userId,
        gmailMessageId: email.id,
        emailSubject: debugMode ? email.subject : null,
        emailFrom: debugMode ? email.from : null,
        emailSnippet: debugMode ? email.snippet : null,
        status: "skipped",
        error: skipCheck.reason,
        createdAt: new Date(),
      });

      console.log(`Email skipped: ${skipCheck.reason}`);
      return { ...results, skipped: 1 };
    }

    // Fetch the prompts to process
    const userPrompts = await db.query.prompts.findMany({
      where: and(
        eq(prompts.userId, userId),
        eq(prompts.isActive, true),
        eq(prompts.isPublished, true),
        inArray(prompts.id, promptIds)
      ),
    });

    if (userPrompts.length === 0) {
      console.log(`No matching active prompts for user ${userId}`);
      return results;
    }

    // Process email with each prompt
    for (const prompt of userPrompts) {
      // Check prompt-specific skip filters
      const promptSkipCheck = shouldSkipByPromptFilters(email, prompt);
      if (promptSkipCheck.skip) {
        await db.insert(emailLogs).values({
          userId,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: debugMode ? email.subject : null,
          emailFrom: debugMode ? email.from : null,
          emailSnippet: debugMode ? email.snippet : null,
          status: "skipped",
          error: promptSkipCheck.reason,
          createdAt: new Date(),
        });
        results.skipped++;
        console.log(`Email skipped for prompt "${prompt.name}": ${promptSkipCheck.reason}`);
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
          emailSubject: debugMode ? email.subject : null,
          emailFrom: debugMode ? email.from : null,
          emailSnippet: debugMode ? email.snippet : null,
          aiResponse: debugMode ? aiResult.text : null,
          actionsExecuted: executedActions,
          status: "processed",
          processedAt: new Date(),
        });

        results.processed++;
        console.log(`Email processed with prompt "${prompt.name}": ${executedActions.length} actions executed`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        console.error(`Failed to process email with prompt "${prompt.name}":`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          emailId: email.id,
          promptId: prompt.id,
        });

        await db.insert(emailLogs).values({
          userId,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: debugMode ? email.subject : null,
          emailFrom: debugMode ? email.from : null,
          emailSnippet: debugMode ? email.snippet : null,
          status: "failed",
          error: errorMessage,
        });

        results.failed++;
      }
    }

    console.log(`Email "${email.subject}" processing complete:`, results);
    return results;
  },
});
