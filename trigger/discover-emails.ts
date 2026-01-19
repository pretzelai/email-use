import { schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { gmailTokens, prompts, userSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fetchAllNewEmails, refreshGmailTokens } from "@/lib/gmail";
import { isEmailProcessed } from "./helpers";
import { processSingleEmailTask } from "./process-single-email";

// Scheduled task that discovers emails and triggers processing jobs
export const discoverEmailsTask = schedules.task({
  id: "discover-emails-cron",
  // Run every 10 minutes
  cron: "*/10 * * * *",
  run: async () => {
    console.log("Starting email discovery...");

    // Get all users with Gmail connected
    const usersWithGmail = await db.query.gmailTokens.findMany();

    if (usersWithGmail.length === 0) {
      console.log("No users with Gmail connected");
      return { usersProcessed: 0, emailsTriggered: 0 };
    }

    let totalEmailsTriggered = 0;
    const userResults = [];

    for (const gmailToken of usersWithGmail) {
      const userId = gmailToken.userId;
      console.log(`Discovering emails for user ${userId}...`);

      try {
        // Refresh token if expired
        let accessToken = gmailToken.accessToken;
        const tokenExpired = new Date() >= new Date(gmailToken.expiresAt);

        if (tokenExpired) {
          console.log(`Refreshing token for user ${userId}...`);
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

            console.log(`Token refreshed for user ${userId}`);
          } catch (error) {
            const errorDetails = error instanceof Error ? error.message : String(error);
            console.error(`Failed to refresh token for user ${userId}:`, errorDetails);

            if (errorDetails.includes("invalid_grant")) {
              console.error(`User ${userId} needs to re-authenticate`);
            }

            userResults.push({ userId, error: `Token refresh failed: ${errorDetails}`, emailsTriggered: 0 });
            continue;
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
          console.log(`No active published prompts for user ${userId}`);
          userResults.push({ userId, error: "No active published prompts", emailsTriggered: 0 });
          continue;
        }

        const promptIds = userPrompts.map((p) => p.id);

        // Check if user has debug mode enabled
        const settings = await db.query.userSettings.findFirst({
          where: eq(userSettings.userId, userId),
        });
        const debugMode = settings?.debugMode ?? false;

        // Only process emails received AFTER the account was connected
        const accountConnectedAt = gmailToken.createdAt || new Date();

        // Fetch all new emails (with pagination, up to 100 per user per run)
        const emails = await fetchAllNewEmails(accessToken, {
          afterDate: accountConnectedAt,
          unreadOnly: false,
          maxEmails: 100,
        });

        console.log(`Found ${emails.length} emails for user ${userId}`);

        // Filter out already processed emails and trigger jobs for new ones
        let emailsTriggered = 0;

        for (const email of emails) {
          const alreadyProcessed = await isEmailProcessed(userId, email.id);
          if (alreadyProcessed) {
            console.log(`Email "${email.subject}" already processed, skipping`);
            continue;
          }

          // Trigger the process-single-email task
          await processSingleEmailTask.trigger({
            userId,
            accessToken,
            email,
            promptIds,
            debugMode,
          });

          emailsTriggered++;
          totalEmailsTriggered++;
          console.log(`Triggered processing for email "${email.subject}"`);
        }

        userResults.push({ userId, emailsTriggered });
        console.log(`User ${userId}: triggered ${emailsTriggered} email processing jobs`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error discovering emails for user ${userId}:`, errorMessage);
        userResults.push({ userId, error: errorMessage, emailsTriggered: 0 });
      }
    }

    console.log(`Email discovery complete. Triggered ${totalEmailsTriggered} processing jobs`);

    return {
      usersProcessed: usersWithGmail.length,
      emailsTriggered: totalEmailsTriggered,
      userResults,
    };
  },
});
