"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface FetchedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
}

export default function AddTestingEmailsPage() {
  const router = useRouter();
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailCount, setEmailCount] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEmail, setSelectedEmail] = useState<FetchedEmail | null>(null);
  const [saveResult, setSaveResult] = useState<{
    saved: number;
    skipped: number;
  } | null>(null);

  const handleFetchEmails = async () => {
    setFetching(true);
    setSelectedIds(new Set());
    setSaveResult(null);

    try {
      const res = await fetch(`/api/emails/fetch?limit=${emailCount}`);
      const data = await res.json();

      if (res.ok) {
        setFetchedEmails(data);
      } else {
        alert(data.error || "Failed to fetch emails");
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      alert("Failed to fetch emails");
    } finally {
      setFetching(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === fetchedEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fetchedEmails.map((e) => e.id)));
    }
  };

  const handleSelectEmail = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSaveAsTestingEmails = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one email");
      return;
    }

    setSaving(true);
    setSaveResult(null);

    const emailsToSave = fetchedEmails.filter((e) => selectedIds.has(e.id));

    try {
      const res = await fetch("/api/testing-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsToSave }),
      });

      const data = await res.json();

      if (res.ok) {
        setSaveResult({ saved: data.saved, skipped: data.skipped });
        // Clear selection after saving
        setSelectedIds(new Set());
      } else {
        alert(data.error || "Failed to save testing emails");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save testing emails");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Add Testing Emails
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Fetch emails from your inbox and save them for testing prompts.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {/* Fetch Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fetch Emails from Gmail</CardTitle>
          <CardDescription>
            Pull recent emails to use as test samples for your prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="emailCount"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Number of emails:
              </label>
              <input
                id="emailCount"
                type="number"
                min="1"
                max="100"
                value={emailCount}
                onChange={(e) =>
                  setEmailCount(Math.max(1, parseInt(e.target.value) || 10))
                }
                className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <Button onClick={handleFetchEmails} disabled={fetching}>
              {fetching ? "Fetching..." : "Fetch Emails"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Selection */}
      {fetchedEmails.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Select Emails ({fetchedEmails.length} fetched)
              </CardTitle>
              <Button
                onClick={handleSaveAsTestingEmails}
                disabled={saving || selectedIds.size === 0}
              >
                {saving
                  ? "Saving..."
                  : `Save ${selectedIds.size} as Testing Emails`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {saveResult && (
              <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Saved {saveResult.saved} emails as testing emails.
                  {saveResult.skipped > 0 && (
                    <span className="ml-1">
                      ({saveResult.skipped} skipped - already saved)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Selection Controls */}
            <div className="mb-4 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === fetchedEmails.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedIds.size} selected)
                </span>
              </label>
            </div>

            {/* Email List */}
            <div className="max-h-[500px] divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
              {fetchedEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-start gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(email.id)}
                    onChange={() => handleSelectEmail(email.id)}
                    className="mt-1 h-4 w-4 rounded border-zinc-300"
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900 dark:text-white">
                          {email.subject || "(No Subject)"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                          {email.from}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {email.snippet}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-zinc-400">
                        {formatDate(email.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!fetching && fetchedEmails.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              Click &quot;Fetch Emails&quot; to load emails from your inbox.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900">
            <div className="mb-4 flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {selectedEmail.subject || "(No Subject)"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  From: {selectedEmail.from}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatDate(selectedEmail.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedEmail.body || selectedEmail.snippet || "No content",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
