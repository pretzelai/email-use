"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AVAILABLE_MODELS, type AIProvider } from "@/lib/ai";
import type { Prompt } from "@/lib/db/schema";

interface PromptFormProps {
  prompt?: Prompt;
  mode: "create" | "edit";
}

export function PromptForm({ prompt, mode }: PromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(prompt?.name || "");
  const [description, setDescription] = useState(prompt?.description || "");
  const [promptText, setPromptText] = useState(prompt?.promptText || "");
  const [provider, setProvider] = useState<AIProvider>(
    (prompt?.provider as AIProvider) || "anthropic"
  );
  const [model, setModel] = useState(
    prompt?.model || AVAILABLE_MODELS.anthropic[0].id
  );
  const [isActive, setIsActive] = useState(prompt?.isActive ?? true);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(AVAILABLE_MODELS[newProvider][0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url =
        mode === "create" ? "/api/prompts" : `/api/prompts?id=${prompt?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          promptText,
          provider,
          model,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      router.push("/dashboard/prompts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Prompt" : "Edit Prompt"}
          </CardTitle>
          <CardDescription>
            Define how the AI should process your emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Email Categorizer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this prompt does"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select
                id="provider"
                value={provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as AIProvider)
                }
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {AVAILABLE_MODELS[provider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt</Label>
            <Textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter your prompt here. The email content will be appended to this prompt."
              className="min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-xs text-zinc-500">
              The email subject, from, and body will be appended to your prompt.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <Label htmlFor="isActive" className="font-normal">
              Active (process emails with this prompt)
            </Label>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create Prompt" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/prompts")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
