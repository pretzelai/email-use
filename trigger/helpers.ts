import { db } from "@/lib/db";
import { emailLogs, userSkipFilters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { EmailMessage } from "@/lib/gmail";

// Helper to extract domain from email address
export function extractDomain(email: string): string | null {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : null;
}

// Helper to extract email address from "Name <email@domain.com>" format
export function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase();
}

// Check if email should be skipped based on user's skip filters
export async function shouldSkipEmail(
  userId: string,
  fromAddress: string
): Promise<{ skip: boolean; reason?: string }> {
  const filters = await db.query.userSkipFilters.findMany({
    where: eq(userSkipFilters.userId, userId),
  });

  if (filters.length === 0) {
    return { skip: false };
  }

  const email = extractEmailAddress(fromAddress);
  const domain = extractDomain(fromAddress);

  for (const filter of filters) {
    if (filter.filterType === "email" && email === filter.value.toLowerCase()) {
      return { skip: true, reason: `Email address "${filter.value}" is in skip list` };
    }
    if (filter.filterType === "domain" && domain === filter.value.toLowerCase()) {
      return { skip: true, reason: `Domain "${filter.value}" is in skip list` };
    }
  }

  return { skip: false };
}

// Check if email was already processed
export async function isEmailProcessed(
  userId: string,
  gmailMessageId: string
): Promise<boolean> {
  const existing = await db.query.emailLogs.findFirst({
    where: and(
      eq(emailLogs.userId, userId),
      eq(emailLogs.gmailMessageId, gmailMessageId)
    ),
  });
  return !!existing;
}

// System labels that don't count as "custom labels"
export const SYSTEM_LABELS = new Set([
  "INBOX",
  "UNREAD",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "STARRED",
  "IMPORTANT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

// Check if email should be skipped based on prompt's skip filters
export function shouldSkipByPromptFilters(
  email: EmailMessage,
  prompt: {
    skipArchived?: boolean | null;
    skipRead?: boolean | null;
    skipLabeled?: boolean | null;
    skipStarred?: boolean | null;
    skipImportant?: boolean | null;
  }
): { skip: boolean; reason?: string } {
  const labels = email.labelIds || [];

  // Skip archived (not in INBOX)
  if (prompt.skipArchived && !labels.includes("INBOX")) {
    return { skip: true, reason: "Email is archived (not in INBOX)" };
  }

  // Skip read (no UNREAD label)
  if (prompt.skipRead && !labels.includes("UNREAD")) {
    return { skip: true, reason: "Email is already read" };
  }

  // Skip starred
  if (prompt.skipStarred && labels.includes("STARRED")) {
    return { skip: true, reason: "Email is starred" };
  }

  // Skip important
  if (prompt.skipImportant && labels.includes("IMPORTANT")) {
    return { skip: true, reason: "Email is marked as important" };
  }

  // Skip already labeled (has custom labels)
  if (prompt.skipLabeled) {
    const customLabels = labels.filter((l) => !SYSTEM_LABELS.has(l));
    if (customLabels.length > 0) {
      return {
        skip: true,
        reason: `Email already has labels: ${customLabels.join(", ")}`,
      };
    }
  }

  return { skip: false };
}
