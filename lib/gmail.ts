import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BETTER_AUTH_URL}/api/gmail/callback`
);

// Scopes needed for Gmail access
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
];

export function getGmailAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    state,
  });
}

export async function getGmailTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshGmailTokens(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: Date;
  labelIds: string[];
}

export async function fetchNewEmails(
  accessToken: string,
  maxResults: number = 10,
  options?: {
    afterDate?: Date; // Only fetch emails after this date
    unreadOnly?: boolean; // Default true
  }
): Promise<EmailMessage[]> {
  const gmail = getGmailClient(accessToken);

  // Build query
  const queryParts: string[] = [];

  if (options?.unreadOnly !== false) {
    queryParts.push("is:unread");
  }

  if (options?.afterDate) {
    // Gmail uses epoch seconds for after: query
    const epochSeconds = Math.floor(options.afterDate.getTime() / 1000);
    queryParts.push(`after:${epochSeconds}`);
  }

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: queryParts.join(" ") || undefined,
  });

  const messages = response.data.messages || [];
  const emails: EmailMessage[] = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
    const from = headers.find((h) => h.name === "From")?.value || "Unknown";
    const dateHeader = headers.find((h) => h.name === "Date")?.value;

    // Extract body
    let body = "";
    const payload = detail.data.payload;

    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      const textPart = payload.parts.find(
        (p) => p.mimeType === "text/plain" || p.mimeType === "text/html"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    emails.push({
      id: msg.id!,
      threadId: msg.threadId!,
      subject,
      from,
      snippet: detail.data.snippet || "",
      body,
      date: dateHeader ? new Date(dateHeader) : new Date(),
      labelIds: detail.data.labelIds || [],
    });
  }

  return emails;
}

export async function markAsRead(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

export async function getGmailProfile(accessToken: string) {
  const gmail = getGmailClient(accessToken);
  const profile = await gmail.users.getProfile({ userId: "me" });
  return profile.data;
}

// Mark email as unread
export async function markAsUnread(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: ["UNREAD"],
    },
  });
}

// Star email
export async function starEmail(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: ["STARRED"],
    },
  });
}

// Unstar email
export async function unstarEmail(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["STARRED"],
    },
  });
}

// Archive email (remove from inbox)
export async function archiveEmail(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });
}

// List all user labels
export async function listLabels(accessToken: string) {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.labels.list({ userId: "me" });
  return response.data.labels || [];
}

// Get or create a label
export async function getOrCreateLabel(
  accessToken: string,
  labelName: string
): Promise<string> {
  const gmail = getGmailClient(accessToken);

  // First, try to find existing label
  const labels = await listLabels(accessToken);
  const existingLabel = labels.find(
    (l) => l.name?.toLowerCase() === labelName.toLowerCase()
  );

  if (existingLabel?.id) {
    return existingLabel.id;
  }

  // Create new label
  const newLabel = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });

  return newLabel.data.id!;
}

// Add label to email
export async function addLabel(
  accessToken: string,
  messageId: string,
  labelName: string
) {
  const gmail = getGmailClient(accessToken);
  const labelId = await getOrCreateLabel(accessToken, labelName);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: [labelId],
    },
  });

  return { labelId, labelName };
}

// Send email
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
) {
  const gmail = getGmailClient(accessToken);

  // Get sender's email for the From header
  const profile = await getGmailProfile(accessToken);
  const from = profile.emailAddress;

  // Build email headers
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
  ];

  // If replying, add References and In-Reply-To headers
  let threadId: string | undefined;
  if (replyToMessageId) {
    const originalMessage = await gmail.users.messages.get({
      userId: "me",
      id: replyToMessageId,
      format: "metadata",
      metadataHeaders: ["Message-ID"],
    });

    const messageIdHeader = originalMessage.data.payload?.headers?.find(
      (h) => h.name === "Message-ID"
    )?.value;

    if (messageIdHeader) {
      headers.push(`In-Reply-To: ${messageIdHeader}`);
      headers.push(`References: ${messageIdHeader}`);
    }

    threadId = originalMessage.data.threadId || undefined;
  }

  // Build raw email
  const emailContent = [...headers, "", body].join("\r\n");
  const encodedEmail = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send email
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId,
    },
  });

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  };
}
