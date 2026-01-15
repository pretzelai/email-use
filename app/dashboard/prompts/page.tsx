"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Prompt } from "@/lib/db/schema";

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this prompt?")) return;

    try {
      const res = await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPrompts(prompts.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium text-zinc-900 dark:text-white">
          Prompts
        </h1>
        <Link href="/dashboard/prompts/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">No prompts yet</p>
          <Link href="/dashboard/prompts/new">
            <Button size="sm" className="mt-2">
              Create prompt
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Provider
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Model
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Status
                </th>
                <th className="w-20 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {prompts.map((prompt) => (
                <tr
                  key={prompt.id}
                  onClick={() => router.push(`/dashboard/prompts/${prompt.id}`)}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-3 py-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {prompt.name}
                    </span>
                    {prompt.description && (
                      <span className="ml-2 text-zinc-500">
                        {prompt.description}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {prompt.provider}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {prompt.model}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Badge variant={prompt.isPublished ? "success" : "warning"}>
                        {prompt.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {!prompt.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(e) => handleDelete(e, prompt.id)}
                      className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
