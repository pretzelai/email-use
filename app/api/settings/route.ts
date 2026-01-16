import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  // Return default settings if none exist
  if (!settings) {
    return NextResponse.json({
      debugMode: false,
    });
  }

  return NextResponse.json({
    debugMode: settings.debugMode,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { debugMode } = body;

  if (typeof debugMode !== "boolean") {
    return NextResponse.json(
      { error: "Invalid debugMode value" },
      { status: 400 }
    );
  }

  // Check if settings exist
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userSettings)
      .set({
        debugMode,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      debugMode,
    });
  }

  return NextResponse.json({ debugMode });
}
