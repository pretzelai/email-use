import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prompts, testingEmails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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

// POST - Dry-run test a prompt with a single testing email (no tool execution)
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
  const { emailId } = body as { emailId: string };

  if (!emailId || typeof emailId !== "string") {
    return NextResponse.json(
      { error: "emailId is required" },
      { status: 400 }
    );
  }

  // Fetch the single testing email
  const email = await db.query.testingEmails.findFirst({
    where: and(
      eq(testingEmails.userId, session.user.id),
      eq(testingEmails.id, emailId)
    ),
  });

  if (!email) {
    return NextResponse.json(
      { error: "Testing email not found" },
      { status: 404 }
    );
  }

  let result: TestResult;

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

    result = {
      emailId: email.id,
      subject: email.subject,
      from: email.fromAddress,
      aiResponse: aiResult.text,
      toolCalls: aiResult.toolCalls,
      status: "success",
    };
  } catch (error) {
    result = {
      emailId: email.id,
      subject: email.subject,
      from: email.fromAddress,
      aiResponse: "",
      toolCalls: [],
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return NextResponse.json({ result });
}
