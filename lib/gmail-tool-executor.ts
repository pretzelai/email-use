import {
  sendEmail,
  addLabel,
  archiveEmail,
  markAsRead,
  markAsUnread,
  starEmail,
  unstarEmail,
} from "./gmail";
import type { ToolCallResult } from "./ai-tools";

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

interface EmailContext {
  id: string;
  from: string;
  subject: string;
}

export async function executeGmailTool(
  toolCall: ToolCall,
  email: EmailContext,
  accessToken: string
): Promise<ToolCallResult> {
  const { toolName, args } = toolCall;

  try {
    switch (toolName) {
      case "sendEmail": {
        const { to, subject, body, isReply } = args as {
          to: string;
          subject: string;
          body: string;
          isReply?: boolean;
        };
        const result = await sendEmail(
          accessToken,
          to,
          subject,
          body,
          isReply ? email.id : undefined
        );
        return {
          tool: toolName,
          args,
          result: { success: true, data: result },
        };
      }

      case "addLabel": {
        const { label, hexColor } = args as { label: string; hexColor?: string };
        const result = await addLabel(accessToken, email.id, label, hexColor);
        return {
          tool: toolName,
          args,
          result: { success: true, data: result },
        };
      }

      case "archiveEmail": {
        await archiveEmail(accessToken, email.id);
        return {
          tool: toolName,
          args,
          result: { success: true },
        };
      }

      case "markAsRead": {
        await markAsRead(accessToken, email.id);
        return {
          tool: toolName,
          args,
          result: { success: true },
        };
      }

      case "markAsUnread": {
        await markAsUnread(accessToken, email.id);
        return {
          tool: toolName,
          args,
          result: { success: true },
        };
      }

      case "starEmail": {
        await starEmail(accessToken, email.id);
        return {
          tool: toolName,
          args,
          result: { success: true },
        };
      }

      case "unstarEmail": {
        await unstarEmail(accessToken, email.id);
        return {
          tool: toolName,
          args,
          result: { success: true },
        };
      }

      default:
        return {
          tool: toolName,
          args,
          result: { success: false, error: `Unknown tool: ${toolName}` },
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      tool: toolName,
      args,
      result: { success: false, error: errorMessage },
    };
  }
}

export async function executeAllTools(
  toolCalls: ToolCall[],
  email: EmailContext,
  accessToken: string
): Promise<ToolCallResult[]> {
  const results: ToolCallResult[] = [];

  for (const toolCall of toolCalls) {
    const result = await executeGmailTool(toolCall, email, accessToken);
    results.push(result);
  }

  return results;
}
