import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk/v3";
import type { discoverEmailsForUserTask } from "@/trigger/discover-emails";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow triggering if debug mode is enabled
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (!settings?.debugMode) {
    return NextResponse.json(
      { error: "Debug mode must be enabled to trigger discovery" },
      { status: 403 },
    );
  }

  try {
    const handle = await tasks.trigger<typeof discoverEmailsForUserTask>(
      "discover-emails-for-user",
      { userId: session.user.id },
    );

    return NextResponse.json({ success: true, id: handle.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
