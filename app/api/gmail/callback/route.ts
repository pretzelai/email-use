import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gmailTokens } from "@/lib/db/schema";
import { getGmailTokens, getGmailProfile } from "@/lib/gmail";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=gmail_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=invalid_callback", request.url)
    );
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());

    const tokens = await getGmailTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=no_tokens", request.url)
      );
    }

    const profile = await getGmailProfile(tokens.access_token);

    const existingToken = await db.query.gmailTokens.findFirst({
      where: eq(gmailTokens.userId, userId),
    });

    if (existingToken) {
      await db
        .update(gmailTokens)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
          email: profile.emailAddress,
          updatedAt: new Date(),
        })
        .where(eq(gmailTokens.userId, userId));
    } else {
      await db.insert(gmailTokens).values({
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        email: profile.emailAddress,
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/settings?success=gmail_connected", request.url)
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=callback_failed", request.url)
    );
  }
}
