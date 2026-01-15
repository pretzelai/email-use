import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const prompt = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, id), eq(prompts.userId, session.user.id)),
    });

    if (!prompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  }

  const userPrompts = await db.query.prompts.findMany({
    where: eq(prompts.userId, session.user.id),
    orderBy: (prompts, { desc }) => [desc(prompts.createdAt)],
  });

  return NextResponse.json(userPrompts);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    description,
    promptText,
    provider,
    model,
    isActive,
    skipArchived,
    skipRead,
    skipLabeled,
    skipStarred,
    skipImportant,
  } = body;

  if (!name || !promptText || !provider || !model) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const [newPrompt] = await db
      .insert(prompts)
      .values({
        userId: session.user.id,
        name,
        description,
        promptText,
        provider,
        model,
        isActive: isActive ?? true,
        skipArchived: skipArchived ?? true,
        skipRead: skipRead ?? true,
        skipLabeled: skipLabeled ?? true,
        skipStarred: skipStarred ?? false,
        skipImportant: skipImportant ?? false,
      })
      .returning();

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
  }

  const body = await request.json();
  const {
    name,
    description,
    promptText,
    provider,
    model,
    isActive,
    skipArchived,
    skipRead,
    skipLabeled,
    skipStarred,
    skipImportant,
  } = body;

  try {
    const [updatedPrompt] = await db
      .update(prompts)
      .set({
        name,
        description,
        promptText,
        provider,
        model,
        isActive,
        skipArchived,
        skipRead,
        skipLabeled,
        skipStarred,
        skipImportant,
        updatedAt: new Date(),
      })
      .where(and(eq(prompts.id, id), eq(prompts.userId, session.user.id)))
      .returning();

    if (!updatedPrompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(prompts)
    .where(and(eq(prompts.id, id), eq(prompts.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
