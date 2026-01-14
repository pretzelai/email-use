import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGmailAuthUrl } from "@/lib/gmail";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id })
  ).toString("base64");
  const authUrl = getGmailAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
