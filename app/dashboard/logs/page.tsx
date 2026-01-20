"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface ActionExecuted {
  tool: string;
  args: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
}

interface EmailLog {
  id: string;
  gmailMessageId: string;
  emailSubject: string | null;
  emailFrom: string | null;
  emailSnippet: string | null;
  aiResponse: string | null;
  actionsExecuted: ActionExecuted[] | null;
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
  const [debugMode, setDebugMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastNewLogTimeRef = useRef<number>(0);
  const currentLogCountRef = useRef<number>(0);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        return data.length;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    return 0;
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setDebugMode(data.debugMode);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteAllLogs = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all logs? This will allow previously processed emails to be reprocessed by your prompts."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/emails", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const stopTimerAndPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setTriggering(false);
    setElapsedTime(0);
  }, []);

  const handleTriggerDiscovery = async () => {
    setTriggering(true);
    setElapsedTime(0);
    currentLogCountRef.current = logs.length;
    lastNewLogTimeRef.current = Date.now();

    // Start elapsed time timer (updates every 100ms for 1 decimal precision)
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      const res = await fetch("/api/trigger-discovery", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to trigger: ${data.error}`);
        stopTimerAndPolling();
        return;
      }

      // Poll for new logs every 2 seconds
      pollRef.current = setInterval(async () => {
        const newCount = await fetchLogs();
        const now = Date.now();

        if (newCount > currentLogCountRef.current) {
          // New logs found, update count and reset the timer
          currentLogCountRef.current = newCount;
          lastNewLogTimeRef.current = now;
          // Stop showing spinner/timer but keep polling in background
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTriggering(false);
          setElapsedTime(0);
        } else if (now - lastNewLogTimeRef.current >= 60000) {
          // No new logs in the last 60 seconds, stop polling
          stopTimerAndPolling();
        }
      }, 2000);
    } catch {
      alert("Failed to trigger discovery job");
      stopTimerAndPolling();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchSettings();
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
          <div className="flex items-center gap-3">
            {debugMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerDiscovery}
                  disabled={triggering}
                >
                  {triggering ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {elapsedTime.toFixed(1)}s
                    </span>
                  ) : (
                    "Trigger Cron Job"
                  )}
                </Button>
                {logs.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAllLogs}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete All Logs"}
                  </Button>
                )}
              </>
            )}
          </div>
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
          {debugMode && (
            <span className="ml-1 text-zinc-400">
              Deleting logs will allow those emails to be reprocessed.
            </span>
          )}
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
                {selectedLog.actionsExecuted &&
                  selectedLog.actionsExecuted.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500">Tool Calls</p>
                      <div className="mt-1 space-y-2">
                        {selectedLog.actionsExecuted.map((action, index) => (
                          <div
                            key={index}
                            className="rounded border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                {action.tool}
                              </span>
                              <Badge
                                variant={
                                  action.result.success
                                    ? "success"
                                    : "destructive"
                                }
                              >
                                {action.result.success ? "Success" : "Failed"}
                              </Badge>
                            </div>
                            <div className="mt-1.5">
                              <p className="text-xs text-zinc-500">Arguments:</p>
                              <div className="mt-0.5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                {Object.entries(action.args).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="font-medium">{key}:</span>
                                    {key === "hexColor" && typeof value === "string" ? (
                                      <span className="flex items-center gap-1.5">
                                        <span
                                          className="inline-block h-3.5 w-3.5 rounded border border-zinc-300 dark:border-zinc-600"
                                          style={{ backgroundColor: value }}
                                        />
                                        <span>{value}</span>
                                      </span>
                                    ) : (
                                      <span>
                                        {typeof value === "string"
                                          ? value
                                          : JSON.stringify(value)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {action.result.error && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                Error: {action.result.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                      ? selectedLog.aiResponse || "No text response"
                      : `Error: ${selectedLog.error || "Unknown"}`}
                  </pre>
                </div>
                {selectedLog.actionsExecuted &&
                  selectedLog.actionsExecuted.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500">Tool Calls</p>
                      <div className="mt-1 space-y-2">
                        {selectedLog.actionsExecuted.map((action, index) => (
                          <div
                            key={index}
                            className="rounded border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                {action.tool}
                              </span>
                              <Badge
                                variant={
                                  action.result.success
                                    ? "success"
                                    : "destructive"
                                }
                              >
                                {action.result.success ? "Success" : "Failed"}
                              </Badge>
                            </div>
                            <div className="mt-1.5">
                              <p className="text-xs text-zinc-500">Arguments:</p>
                              <div className="mt-0.5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                {Object.entries(action.args).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="font-medium">{key}:</span>
                                    {key === "hexColor" && typeof value === "string" ? (
                                      <span className="flex items-center gap-1.5">
                                        <span
                                          className="inline-block h-3.5 w-3.5 rounded border border-zinc-300 dark:border-zinc-600"
                                          style={{ backgroundColor: value }}
                                        />
                                        <span>{value}</span>
                                      </span>
                                    ) : (
                                      <span>
                                        {typeof value === "string"
                                          ? value
                                          : JSON.stringify(value)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {action.result.error && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                Error: {action.result.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
