"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

export default function LogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const selectedLog = logs.find((l) => l.id === selectedLogId);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-base font-medium text-zinc-900 dark:text-white">
            Logs
          </h1>
          <span className="text-sm text-zinc-500">{logs.length} processed</span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          If you want to store email content and AI logs for debugging, go to{" "}
          <Link
            href="/dashboard/settings"
            className="text-zinc-900 underline dark:text-white"
          >
            settings
          </Link>{" "}
          and activate Debug Mode.
        </p>
      </div>

      {/* Processing History */}
      <div className="flex-1 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
        {logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            No emails processed yet
          </p>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    Gmail
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    Subject
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    Prompt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={`https://mail.google.com/mail/u/0/#inbox/${log.gmailMessageId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                      >
                        Open in Gmail
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      {log.emailSubject ? (
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {log.emailSubject}
                        </span>
                      ) : (
                        <span className="italic text-zinc-400">
                          No details stored
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {log.promptName || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          log.status === "processed" ? "success" : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLogId(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-white">
                  {selectedLog.emailSubject || "(No Subject)"}
                </p>
                <p className="text-xs text-zinc-500">{selectedLog.emailFrom}</p>
              </div>
              <button
                onClick={() => setSelectedLogId(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            {!selectedLog.emailSubject && !selectedLog.emailSnippet ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <strong>No details stored.</strong> Email content is not
                    saved when debug mode is disabled.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    To store email subjects, snippets, and AI responses, enable{" "}
                    <span className="font-medium">Debug Mode</span> in Settings.
                  </p>
                </div>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span>Prompt: {selectedLog.promptName || "—"}</span>
                  <span>Processed: {formatDate(selectedLog.processedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Snippet</p>
                  <p className="mt-1 rounded bg-zinc-50 p-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {selectedLog.emailSnippet || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">AI Response</p>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 p-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {selectedLog.status === "processed"
                      ? selectedLog.aiResponse
                      : `Error: ${selectedLog.error || "Unknown"}`}
                  </pre>
                </div>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span>Prompt: {selectedLog.promptName || "—"}</span>
                  <span>Processed: {formatDate(selectedLog.processedAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
