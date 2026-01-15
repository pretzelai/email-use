import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH - Toggle publish status of a prompt
export async function PATCH(
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
  const { isPublished } = body as { isPublished: boolean };

  if (typeof isPublished !== "boolean") {
    return NextResponse.json(
      { error: "isPublished must be a boolean" },
      { status: 400 }
    );
  }

  // Update the prompt
  const [updated] = await db
    .update(prompts)
    .set({
      isPublished,
      updatedAt: new Date(),
    })
    .where(eq(prompts.id, id))
    .returning();

  return NextResponse.json(updated);
}
