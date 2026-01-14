import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

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
