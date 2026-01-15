import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prompts, testingEmails } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { processEmailWithTools, type AIProvider } from "@/lib/ai";

interface TestResult {
  emailId: string;
  subject: string;
  from: string;
  aiResponse: string;
  toolCalls: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
  status: "success" | "failed";
  error?: string;
}

// POST - Dry-run test a prompt with testing emails (no tool execution)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  }

  // Verify the prompt belongs to the user
  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), eq(prompts.userId, session.user.id)),
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const body = await request.json();
  const { emailIds } = body as { emailIds: string[] };

  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return NextResponse.json(
      { error: "emailIds array is required" },
      { status: 400 }
    );
  }

  // Fetch the testing emails
  const emails = await db.query.testingEmails.findMany({
    where: and(
      eq(testingEmails.userId, session.user.id),
      inArray(testingEmails.id, emailIds)
    ),
  });

  if (emails.length === 0) {
    return NextResponse.json(
      { error: "No testing emails found with the provided IDs" },
      { status: 404 }
    );
  }

  const results: TestResult[] = [];

  // Process each email with the prompt (dry-run - no tool execution)
  for (const email of emails) {
    try {
      const aiResult = await processEmailWithTools({
        promptText: prompt.promptText,
        email: {
          id: email.gmailMessageId,
          threadId: email.threadId,
          subject: email.subject,
          from: email.fromAddress,
          body: email.body || email.snippet || "",
        },
        provider: prompt.provider as AIProvider,
        model: prompt.model,
      });

      results.push({
        emailId: email.id,
        subject: email.subject,
        from: email.fromAddress,
        aiResponse: aiResult.text,
        toolCalls: aiResult.toolCalls,
        status: "success",
      });
    } catch (error) {
      results.push({
        emailId: email.id,
        subject: email.subject,
        from: email.fromAddress,
        aiResponse: "",
        toolCalls: [],
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
