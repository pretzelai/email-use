import { tool, zodSchema } from "ai";
import { z } from "zod";

// Gmail tools for AI to use when processing emails
export const gmailTools = {
  sendEmail: tool({
    description:
      "Send a new email or reply to the current email. Use this to respond to the sender or forward information to someone else.",
    inputSchema: zodSchema(
      z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body content (plain text)"),
        isReply: z
          .boolean()
          .optional()
          .describe(
            "Set to true if this is a reply to the current email (will thread the conversation)"
          ),
      })
    ),
  }),

  addLabel: tool({
    description:
      "Add a label to the email for organization. Creates the label if it doesn't exist. Use this to categorize or tag emails.",
    inputSchema: zodSchema(
      z.object({
        label: z
          .string()
          .describe(
            "Label name to add (e.g., 'Important', 'Follow-up', 'Newsletters')"
          ),
        hexColor: z
          .string()
          .optional()
          .describe(
            "Optional hex color for the label background (e.g., '#ff0000'). Only applies to new labels."
          ),
      })
    ),
  }),

  archiveEmail: tool({
    description:
      "Archive the email by removing it from the inbox. The email will still be searchable but won't clutter the inbox.",
    inputSchema: zodSchema(z.object({})),
  }),

  markAsRead: tool({
    description: "Mark the email as read.",
    inputSchema: zodSchema(z.object({})),
  }),

  markAsUnread: tool({
    description:
      "Mark the email as unread. Use this if the email needs attention later.",
    inputSchema: zodSchema(z.object({})),
  }),

  starEmail: tool({
    description:
      "Star the email to mark it as important or for follow-up. Starred emails appear in the Starred folder in Gmail.",
    inputSchema: zodSchema(z.object({})),
  }),

  unstarEmail: tool({
    description: "Remove the star from the email.",
    inputSchema: zodSchema(z.object({})),
  }),
};

export type GmailToolName = keyof typeof gmailTools;

export type ToolCallResult = {
  tool: string;
  args: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
};
