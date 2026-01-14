import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { gmailTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await db.query.gmailTokens.findFirst({
    where: eq(gmailTokens.userId, session.user.id),
  });

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    email: token.email,
    lastSync: token.updatedAt,
  });
}

export async function DELETE() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(gmailTokens).where(eq(gmailTokens.userId, session.user.id));

  return NextResponse.json({ success: true });
}
