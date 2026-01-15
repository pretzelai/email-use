import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { testingEmails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - List all testing emails for the current user
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = await db.query.testingEmails.findMany({
    where: eq(testingEmails.userId, session.user.id),
    orderBy: (emails, { desc }) => [desc(emails.createdAt)],
  });

  return NextResponse.json(emails);
}

// POST - Save selected emails as testing emails
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { emails } = body as {
    emails: Array<{
      id: string;
      threadId: string;
      subject: string;
      from: string;
      snippet?: string;
      body?: string;
      date?: string;
    }>;
  };

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
      { error: "emails array is required" },
      { status: 400 }
    );
  }

  // Check for duplicates - get existing gmail message IDs
  const existingEmails = await db.query.testingEmails.findMany({
    where: eq(testingEmails.userId, session.user.id),
    columns: { gmailMessageId: true },
  });
  const existingIds = new Set(existingEmails.map((e) => e.gmailMessageId));

  // Filter out duplicates
  const newEmails = emails.filter((e) => !existingIds.has(e.id));

  if (newEmails.length === 0) {
    return NextResponse.json(
      { error: "All selected emails are already saved as testing emails" },
      { status: 409 }
    );
  }

  // Insert new testing emails
  const inserted = await db
    .insert(testingEmails)
    .values(
      newEmails.map((email) => ({
        userId: session.user.id,
        gmailMessageId: email.id,
        threadId: email.threadId,
        subject: email.subject,
        fromAddress: email.from,
        snippet: email.snippet,
        body: email.body,
        emailDate: email.date ? new Date(email.date) : undefined,
      }))
    )
    .returning();

  return NextResponse.json(
    { saved: inserted.length, skipped: emails.length - newEmails.length },
    { status: 201 }
  );
}

// DELETE - Delete a testing email by ID or clear all
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("clearAll");

  // Clear all testing emails for user
  if (clearAll === "true") {
    await db
      .delete(testingEmails)
      .where(eq(testingEmails.userId, session.user.id));

    return NextResponse.json({ success: true, cleared: "all" });
  }

  // Delete single testing email
  if (!id) {
    return NextResponse.json(
      { error: "ID is required (or use clearAll=true)" },
      { status: 400 }
    );
  }

  // Verify the testing email belongs to the user
  const email = await db.query.testingEmails.findFirst({
    where: and(
      eq(testingEmails.id, id),
      eq(testingEmails.userId, session.user.id)
    ),
  });

  if (!email) {
    return NextResponse.json(
      { error: "Testing email not found" },
      { status: 404 }
    );
  }

  await db.delete(testingEmails).where(eq(testingEmails.id, id));

  return NextResponse.json({ success: true });
}
