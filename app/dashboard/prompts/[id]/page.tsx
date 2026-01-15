"use client";

import { useEffect, useState, use } from "react";
import { PromptForm } from "@/components/dashboard/prompt-form";
import { PromptTestingSection } from "@/components/dashboard/prompt-testing-section";
import type { Prompt } from "@/lib/db/schema";

export default function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch(`/api/prompts?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data);
        }
      } catch (error) {
        console.error("Failed to fetch prompt:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  const handlePublishChange = (isPublished: boolean) => {
    if (prompt) {
      setPrompt({ ...prompt, isPublished });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-zinc-500">Prompt not found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PromptForm
        prompt={prompt}
        mode="edit"
        onPublishChange={handlePublishChange}
      />
      <PromptTestingSection promptId={prompt.id} />
    </div>
  );
}
