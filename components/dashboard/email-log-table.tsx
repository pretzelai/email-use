"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";

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

interface EmailLogTableProps {
  logs: EmailLog[];
  onViewDetails: (log: EmailLog) => void;
}

export function EmailLogTable({ logs, onViewDetails }: EmailLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-12 dark:border-zinc-700 dark:bg-zinc-900">
        <svg
          className="h-12 w-12 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
          No emails processed yet
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Connect Gmail and sync to start processing emails.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Prompt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {logs.map((log) => (
            <tr
              key={log.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <p className="truncate font-medium text-zinc-900 dark:text-white">
                    {log.emailSubject || "(No Subject)"}
                  </p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {log.emailFrom}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  {log.promptName || "Deleted prompt"}
                </span>
              </td>
              <td className="px-6 py-4">
                <Badge
                  variant={log.status === "processed" ? "success" : "destructive"}
                >
                  {log.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onViewDetails(log)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EmailLogDetailProps {
  log: EmailLog;
  onClose: () => void;
}

export function EmailLogDetail({ log, onClose }: EmailLogDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {log.emailSubject || "(No Subject)"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              From: {log.emailFrom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Snippet
            </h3>
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {log.emailSnippet || "No content"}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              AI Response
            </h3>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              {log.status === "processed" ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                  {log.aiResponse}
                </pre>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error: {log.error || "Unknown error"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>Prompt: {log.promptName || "Deleted"}</span>
            <span>Processed: {formatDate(log.processedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
