"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmailLogTable,
  EmailLogDetail,
} from "@/components/dashboard/email-log-table";

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

export default function EmailsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [syncResult, setSyncResult] = useState<{
    processed: number;
    failed: number;
  } | null>(null);

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
              Sync Emails
            </>
          )}
        </Button>
      </div>

      {syncResult && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Sync complete: {syncResult.processed} processed, {syncResult.failed}{" "}
            failed
          </p>
        </div>
      )}

      <EmailLogTable logs={logs} onViewDetails={setSelectedLog} />

      {selectedLog && (
        <EmailLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
