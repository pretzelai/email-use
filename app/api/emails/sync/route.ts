import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { gmailTokens, prompts, emailLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  fetchNewEmails,
  refreshGmailTokens,
  type EmailMessage,
} from "@/lib/gmail";
import { processEmailWithAI, type AIProvider } from "@/lib/ai";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gmailToken = await db.query.gmailTokens.findFirst({
    where: eq(gmailTokens.userId, session.user.id),
  });

  if (!gmailToken) {
    return NextResponse.json(
      { error: "Gmail not connected" },
      { status: 400 }
    );
  }

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
        .where(eq(gmailTokens.userId, session.user.id));
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return NextResponse.json(
        { error: "Failed to refresh Gmail token" },
        { status: 401 }
      );
    }
  }

  const userPrompts = await db.query.prompts.findMany({
    where: and(
      eq(prompts.userId, session.user.id),
      eq(prompts.isActive, true)
    ),
  });

  if (userPrompts.length === 0) {
    return NextResponse.json(
      { error: "No active prompts configured" },
      { status: 400 }
    );
  }

  let emails: EmailMessage[];
  try {
    emails = await fetchNewEmails(accessToken, 10);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails from Gmail" },
      { status: 500 }
    );
  }

  const results: Array<{
    emailId: string;
    subject: string;
    promptName: string;
    status: string;
    response?: string;
    error?: string;
  }> = [];

  for (const email of emails) {
    const existingLog = await db.query.emailLogs.findFirst({
      where: and(
        eq(emailLogs.userId, session.user.id),
        eq(emailLogs.gmailMessageId, email.id)
      ),
    });

    if (existingLog) {
      continue;
    }

    for (const prompt of userPrompts) {
      try {
        const aiResponse = await processEmailWithAI({
          promptText: prompt.promptText,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailBody: email.body || email.snippet,
          provider: prompt.provider as AIProvider,
          model: prompt.model,
        });

        await db.insert(emailLogs).values({
          userId: session.user.id,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailSnippet: email.snippet,
          aiResponse,
          status: "processed",
          processedAt: new Date(),
        });

        results.push({
          emailId: email.id,
          subject: email.subject,
          promptName: prompt.name,
          status: "processed",
          response: aiResponse,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await db.insert(emailLogs).values({
          userId: session.user.id,
          promptId: prompt.id,
          gmailMessageId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailSnippet: email.snippet,
          status: "failed",
          error: errorMessage,
        });

        results.push({
          emailId: email.id,
          subject: email.subject,
          promptName: prompt.name,
          status: "failed",
          error: errorMessage,
        });
      }
    }
  }

  await db
    .update(gmailTokens)
    .set({ updatedAt: new Date() })
    .where(eq(gmailTokens.userId, session.user.id));

  return NextResponse.json({
    processed: results.filter((r) => r.status === "processed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: emails.length - results.length / userPrompts.length,
    results,
  });
}
