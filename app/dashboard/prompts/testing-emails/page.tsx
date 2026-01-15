"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailCount, setEmailCount] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      }
    } catch (error) {
      console.error("Fetch failed:", error);
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
    if (selectedIds.size === 0) return;

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
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/prompts"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            ← Back
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <h1 className="text-base font-medium text-zinc-900 dark:text-white">
            Add Testing Emails
          </h1>
        </div>
      </div>

      {/* Fetch Controls */}
      <div className="flex items-center gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
        <input
          type="number"
          min="1"
          max="100"
          value={emailCount}
          onChange={(e) => setEmailCount(Math.max(1, parseInt(e.target.value) || 10))}
          className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <Button size="sm" onClick={handleFetchEmails} disabled={fetching}>
          {fetching ? "Fetching..." : "Fetch from Gmail"}
        </Button>
        {fetchedEmails.length > 0 && (
          <>
            <span className="text-sm text-zinc-500">
              {fetchedEmails.length} emails
            </span>
            <Button
              size="sm"
              onClick={handleSaveAsTestingEmails}
              disabled={saving || selectedIds.size === 0}
            >
              {saving ? "Saving..." : `Save ${selectedIds.size} selected`}
            </Button>
          </>
        )}
      </div>

      {saveResult && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          Saved {saveResult.saved} emails
          {saveResult.skipped > 0 && ` (${saveResult.skipped} already existed)`}
        </div>
      )}

      {/* Email List */}
      {fetchedEmails.length > 0 && (
        <div className="rounded border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.size === fetchedEmails.length}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              Select all
            </label>
            <span className="text-xs text-zinc-500">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="max-h-[500px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
            {fetchedEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(email.id)}
                  onChange={() => handleSelectEmail(email.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                    {email.subject || "(No Subject)"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{email.from}</p>
                </div>
                <span className="text-xs text-zinc-400">
                  {formatDate(email.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!fetching && fetchedEmails.length === 0 && (
        <div className="rounded border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Click &quot;Fetch from Gmail&quot; to load emails
          </p>
        </div>
      )}
    </div>
  );
}
