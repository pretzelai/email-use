"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Prompt } from "@/lib/db/schema";

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
}

export function PromptCard({ prompt, onDelete }: PromptCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{prompt.name}</CardTitle>
            <CardDescription className="mt-1">
              {prompt.description || "No description"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={prompt.isPublished ? "success" : "warning"}>
              {prompt.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge variant={prompt.isActive ? "default" : "secondary"}>
              {prompt.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="capitalize">{prompt.provider}</span>
            <span>-</span>
            <span>{prompt.model}</span>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
              {prompt.promptText}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/prompts/${prompt.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => onDelete(prompt.id)}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
