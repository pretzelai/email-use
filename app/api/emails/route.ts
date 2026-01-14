import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { emailLogs, prompts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const logs = await db
    .select({
      id: emailLogs.id,
      gmailMessageId: emailLogs.gmailMessageId,
      emailSubject: emailLogs.emailSubject,
      emailFrom: emailLogs.emailFrom,
      emailSnippet: emailLogs.emailSnippet,
      aiResponse: emailLogs.aiResponse,
      status: emailLogs.status,
      error: emailLogs.error,
      processedAt: emailLogs.processedAt,
      createdAt: emailLogs.createdAt,
      promptName: prompts.name,
      promptId: prompts.id,
    })
    .from(emailLogs)
    .leftJoin(prompts, eq(emailLogs.promptId, prompts.id))
    .where(eq(emailLogs.userId, session.user.id))
    .orderBy(desc(emailLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(logs);
}
