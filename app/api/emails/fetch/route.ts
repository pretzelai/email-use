import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { gmailTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchNewEmails, refreshGmailTokens } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "5");

  const gmailToken = await db.query.gmailTokens.findFirst({
    where: eq(gmailTokens.userId, session.user.id),
  });

  if (!gmailToken) {
    return NextResponse.json(
      { error: "Gmail not connected" },
      { status: 400 }
    );
  }

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

  try {
    const emails = await fetchNewEmails(accessToken, limit);
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails from Gmail" },
      { status: 500 }
    );
  }
}
