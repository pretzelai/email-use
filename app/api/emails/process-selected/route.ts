import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { gmailTokens, prompts, emailLogs, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { refreshGmailTokens } from "@/lib/gmail";
import { processEmailWithTools, type AIProvider } from "@/lib/ai";
import { executeAllTools } from "@/lib/gmail-tool-executor";
import type { ToolCallResult } from "@/lib/ai-tools";

interface EmailToProcess {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  body: string;
}

interface ProcessResult {
  emailId: string;
  subject: string;
  status: "success" | "failed";
  aiResponse?: string;
  toolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>;
  executedActions?: ToolCallResult[];
  error?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { emails, promptId } = body as {
    emails: EmailToProcess[];
    promptId: string;
  };

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
      { error: "No emails provided" },
      { status: 400 }
    );
  }

  if (!promptId) {
    return NextResponse.json(
      { error: "No prompt selected" },
      { status: 400 }
    );
  }

  // Get the prompt
  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.id, promptId),
  });

  if (!prompt || prompt.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Prompt not found" },
      { status: 404 }
    );
  }

  // Get Gmail tokens
  const gmailToken = await db.query.gmailTokens.findFirst({
    where: eq(gmailTokens.userId, session.user.id),
  });

  if (!gmailToken) {
    return NextResponse.json(
      { error: "Gmail not connected" },
      { status: 400 }
    );
  }

  // Check if user has debug mode enabled
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });
  const debugMode = settings?.debugMode ?? false;

  let accessToken = gmailToken.accessToken;

  // Refresh token if expired
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

  const results: ProcessResult[] = [];

  for (const email of emails) {
    try {
      // Get AI response with tool calls
      const aiResult = await processEmailWithTools({
        promptText: prompt.promptText,
        email: {
          id: email.id,
          threadId: email.threadId,
          subject: email.subject,
          from: email.from,
          body: email.body,
        },
        provider: prompt.provider as AIProvider,
        model: prompt.model,
      });

      // Execute tools server-side
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
        userId: session.user.id,
        promptId: prompt.id,
        gmailMessageId: email.id,
        // Only store email content if debug mode is enabled
        emailSubject: debugMode ? email.subject : null,
        emailFrom: debugMode ? email.from : null,
        emailSnippet: debugMode ? email.body.slice(0, 500) : null,
        aiResponse: debugMode ? aiResult.text : null,
        actionsExecuted: executedActions,
        status: "processed",
        processedAt: new Date(),
      });

      results.push({
        emailId: email.id,
        subject: email.subject,
        status: "success",
        aiResponse: aiResult.text,
        toolCalls: aiResult.toolCalls,
        executedActions: executedActions,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Save failed attempt to database
      await db.insert(emailLogs).values({
        userId: session.user.id,
        promptId: prompt.id,
        gmailMessageId: email.id,
        // Only store email content if debug mode is enabled
        emailSubject: debugMode ? email.subject : null,
        emailFrom: debugMode ? email.from : null,
        emailSnippet: debugMode ? email.body.slice(0, 500) : null,
        status: "failed",
        error: errorMessage,
      });

      results.push({
        emailId: email.id,
        subject: email.subject,
        status: "failed",
        error: errorMessage,
      });
    }
  }

  return NextResponse.json({
    processed: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
