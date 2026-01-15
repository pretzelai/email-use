"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmailLogTable,
  EmailLogDetail,
} from "@/components/dashboard/email-log-table";
import { formatDate } from "@/lib/utils";

interface EmailLog {
  id: string;
  gmailMessageId: string;
  emailSubject: string | null;
  emailFrom: string | null;
  emailSnippet: string | null;
  aiResponse: string | null;
  status: string | null;
  error: string | null;
  processedAt: string | null;
  createdAt: string | null;
  promptName: string | null;
  promptId: string | null;
}

interface FetchedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
}

export default function EmailsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [syncResult, setSyncResult] = useState<{
    processed: number;
    failed: number;
  } | null>(null);

  // For fetched emails preview
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<FetchedEmail | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setSyncResult({ processed: data.processed, failed: data.failed });
        fetchLogs();
      } else {
        alert(data.error || "Failed to sync emails");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to sync emails");
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchEmails = async () => {
    setFetching(true);
    setShowPreview(true);

    try {
      const res = await fetch("/api/emails/fetch?limit=5");
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-zinc-500">Loading email logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Email Logs
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            View processed emails and AI responses.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleFetchEmails} disabled={fetching}>
            {fetching ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Fetching...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                Pull Last 5 Emails
              </>
            )}
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Sync & Process
              </>
            )}
          </Button>
        </div>
      </div>

      {syncResult && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Sync complete: {syncResult.processed} processed, {syncResult.failed}{" "}
            failed
          </p>
        </div>
      )}

      {/* Email Preview Section */}
      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Recent Emails (Unread)</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              <svg
                className="h-4 w-4"
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
            </Button>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="h-6 w-6 animate-spin text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            ) : fetchedEmails.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No unread emails found.
              </p>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {fetchedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="cursor-pointer py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-6 px-6 first:pt-0 last:pb-0"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <EmailLogTable logs={logs} onViewDetails={setSelectedLog} />

      {selectedLog && (
        <EmailLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
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
                  __html: selectedEmail.body || selectedEmail.snippet || "No content",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
