"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Prompt, TestingEmail } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingEmails, setTestingEmails] = useState<TestingEmail[]>([]);
  const [selectedTestEmails, setSelectedTestEmails] = useState<Set<string>>(new Set());
  const [deletingTestEmails, setDeletingTestEmails] = useState(false);

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

  const fetchTestingEmails = async () => {
    try {
      const res = await fetch("/api/testing-emails");
      if (res.ok) {
        const data = await res.json();
        setTestingEmails(data);
      }
    } catch (error) {
      console.error("Failed to fetch testing emails:", error);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchTestingEmails();
  }, []);

  const handleSelectTestEmail = (id: string) => {
    const newSelected = new Set(selectedTestEmails);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTestEmails(newSelected);
  };

  const handleSelectAllTestEmails = () => {
    if (selectedTestEmails.size === testingEmails.length) {
      setSelectedTestEmails(new Set());
    } else {
      setSelectedTestEmails(new Set(testingEmails.map((e) => e.id)));
    }
  };

  const handleDeleteSelectedTestEmails = async () => {
    if (selectedTestEmails.size === 0) return;
    if (!confirm(`Delete ${selectedTestEmails.size} testing email(s)?`)) return;

    setDeletingTestEmails(true);
    try {
      const deletePromises = Array.from(selectedTestEmails).map((id) =>
        fetch(`/api/testing-emails?id=${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      setTestingEmails(testingEmails.filter((e) => !selectedTestEmails.has(e.id)));
      setSelectedTestEmails(new Set());
    } catch (error) {
      console.error("Failed to delete testing emails:", error);
    } finally {
      setDeletingTestEmails(false);
    }
  };

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

      {/* Testing Emails Section */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-zinc-900 dark:text-white">
            Testing Emails
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelectedTestEmails}
              disabled={selectedTestEmails.size === 0 || deletingTestEmails}
            >
              {deletingTestEmails
                ? "Deleting..."
                : `Delete${selectedTestEmails.size > 0 ? ` (${selectedTestEmails.size})` : ""}`}
            </Button>
            <Link href="/dashboard/prompts/testing-emails">
              <Button size="sm" variant="outline">
                + Add
              </Button>
            </Link>
          </div>
        </div>

        {testingEmails.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-300 py-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">No testing emails saved</p>
            <Link href="/dashboard/prompts/testing-emails">
              <Button size="sm" variant="outline" className="mt-2">
                Add testing emails
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTestEmails.size === testingEmails.length && testingEmails.length > 0}
                  onChange={handleSelectAllTestEmails}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                Select all
              </label>
              <span className="text-xs text-zinc-500">
                {testingEmails.length} email{testingEmails.length !== 1 ? "s" : ""}
                {selectedTestEmails.size > 0 && ` • ${selectedTestEmails.size} selected`}
              </span>
            </div>
            <div className="max-h-[300px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {testingEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedTestEmails.has(email.id)}
                    onChange={() => handleSelectTestEmail(email.id)}
                    className="h-3.5 w-3.5 rounded border-zinc-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {email.subject || "(No Subject)"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {email.fromAddress}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {formatDate(email.emailDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
