import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { gmailTools } from "./ai-tools";

export type AIProvider = "anthropic" | "openai";

export const AVAILABLE_MODELS = {
  anthropic: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  ],
} as const;

export async function processEmailWithAI({
  promptText,
  emailSubject,
  emailFrom,
  emailBody,
  provider,
  model,
}: {
  promptText: string;
  emailSubject: string;
  emailFrom: string;
  emailBody: string;
  provider: AIProvider;
  model: string;
}): Promise<string> {
  const emailContent = `Subject: ${emailSubject}
From: ${emailFrom}

${emailBody}`;

  const fullPrompt = `${promptText}

---
EMAIL:
${emailContent}`;

  const modelInstance =
    provider === "anthropic" ? anthropic(model) : openai(model);

  const { text } = await generateText({
    model: modelInstance,
    prompt: fullPrompt,
  });

  return text;
}

// Email context for tool execution
export interface EmailContext {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  body: string;
}

// Tool call from AI
export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

// Result of processing with tools (without execution - that happens server-side)
export interface ProcessWithToolsResult {
  text: string;
  toolCalls: ToolCall[];
}

// Process email with AI (returns tool calls for server-side execution)
export async function processEmailWithTools({
  promptText,
  email,
  provider,
  model,
}: {
  promptText: string;
  email: EmailContext;
  provider: AIProvider;
  model: string;
}): Promise<ProcessWithToolsResult> {
  const emailContent = `Subject: ${email.subject}
From: ${email.from}

${email.body}`;

  const systemPrompt = `You are an email processing assistant. Based on the user's instructions, analyze the email and take appropriate actions using the available tools.

Available tools:
- sendEmail: Send a new email or reply to the current email
- addLabel: Add a label to organize the email
- archiveEmail: Archive the email (remove from inbox)
- markAsRead: Mark the email as read
- markAsUnread: Mark the email as unread

After analyzing the email and taking any actions, provide a brief summary of what you did and why.`;

  const fullPrompt = `${systemPrompt}

USER INSTRUCTIONS:
${promptText}

---
EMAIL:
${emailContent}`;

  const modelInstance =
    provider === "anthropic" ? anthropic(model) : openai(model);

  const result = await generateText({
    model: modelInstance,
    tools: gmailTools,
    prompt: fullPrompt,
  });

  // Extract tool calls from the result
  const toolCalls: ToolCall[] = [];

  // Collect all tool calls from all steps
  if (result.steps) {
    for (const step of result.steps) {
      if (step.toolCalls) {
        for (const tc of step.toolCalls) {
          toolCalls.push({
            toolName: tc.toolName,
            args: tc.input as Record<string, unknown>,
          });
        }
      }
    }
  }

  return {
    text: result.text,
    toolCalls,
  };
}
