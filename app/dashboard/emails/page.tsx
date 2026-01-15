"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STORAGE_KEY = "email-use-fetched-emails";

// System labels to hide from display
const HIDDEN_LABELS = new Set([
  "INBOX",
  "UNREAD",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

function formatLabel(label: string): string {
  // Format label for display (e.g., "Label_My-Label" -> "My Label")
  return label.replace(/^Label_/i, "").replace(/[-_]/g, " ");
}

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
  labelIds: string[];
}

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  model: string;
  isActive: boolean;
  isPublished: boolean;
}

interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
}

interface ProcessResult {
  emailId: string;
  subject: string;
  status: "success" | "failed";
  aiResponse?: string;
  toolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>;
  executedActions?: ToolCallResult[];
  error?: string;
}

export default function EmailsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Fetched emails
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [fetching, setFetching] = useState(false);
  const [emailCount, setEmailCount] = useState(10);

  // Selection and processing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);

  // Email preview
  const [previewEmail, setPreviewEmail] = useState<FetchedEmail | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FetchedEmail[];
        if (parsed.length > 0) {
          setFetchedEmails(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToStorage = useCallback((emails: FetchedEmail[]) => {
    try {
      if (emails.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPrompts();
  }, []);

  const handleFetch = async () => {
    setFetching(true);
    setSelectedIds(new Set());
    setProcessResults([]);

    try {
      const res = await fetch(`/api/emails/fetch?limit=${emailCount}`);
      const data = await res.json();
      if (res.ok) {
        setFetchedEmails(data);
        saveToStorage(data);
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  };

  const handleClear = () => {
    setFetchedEmails([]);
    setSelectedIds(new Set());
    setProcessResults([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === fetchedEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fetchedEmails.map((e) => e.id)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleProcess = async () => {
    if (selectedIds.size === 0 || !selectedPromptId) return;

    setProcessing(true);
    setProcessResults([]);

    const emails = fetchedEmails.filter((e) => selectedIds.has(e.id));

    try {
      const res = await fetch("/api/emails/process-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: emails.map((e) => ({
            id: e.id,
            threadId: e.threadId,
            subject: e.subject,
            from: e.from,
            body: e.body,
          })),
          promptId: selectedPromptId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProcessResults(data.results);
        fetchLogs();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium text-zinc-900 dark:text-white">
          Emails
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
        <input
          type="number"
          min="1"
          max="100"
          value={emailCount}
          onChange={(e) =>
            setEmailCount(Math.max(1, parseInt(e.target.value) || 10))
          }
          className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <Button size="sm" onClick={handleFetch} disabled={fetching}>
          {fetching ? "Fetching..." : "Fetch"}
        </Button>

        {fetchedEmails.length > 0 && (
          <>
            <span className="text-xs text-zinc-400">|</span>
            <select
              value={selectedPromptId}
              onChange={(e) => setSelectedPromptId(e.target.value)}
              className="rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">Select prompt...</option>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isPublished ? "" : " (draft)"}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleProcess}
              disabled={
                processing || selectedIds.size === 0 || !selectedPromptId
              }
            >
              {processing ? "Processing..." : `Process (${selectedIds.size})`}
            </Button>
            <span className="text-xs text-zinc-400">|</span>
            <Button size="xs" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Process Results */}
      {processResults.length > 0 && (
        <div className="rounded border border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Results
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {processResults.map((r) => (
              <div
                key={r.emailId}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span
                  className={
                    r.status === "success" ? "text-green-600" : "text-red-600"
                  }
                >
                  {r.status === "success" ? "✓" : "✗"}
                </span>
                <span className="flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
                  {r.subject}
                </span>
                {r.executedActions && r.executedActions.length > 0 && (
                  <div className="flex gap-1">
                    {r.executedActions.map((a, i) => (
                      <span
                        key={i}
                        className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                      >
                        {a.tool}
                      </span>
                    ))}
                  </div>
                )}
                {r.error && (
                  <span className="text-xs text-red-500">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email List */}
      {fetchedEmails.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.size === fetchedEmails.length}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              All
            </label>
            <span className="text-xs text-zinc-500">
              {fetchedEmails.length} emails • {selectedIds.size} selected •
              stored locally
            </span>
          </div>
          <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
            {fetchedEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(email.id)}
                  onChange={() => handleSelect(email.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setPreviewEmail(email)}
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {email.subject || "(No Subject)"}
                    </p>
                    {email.labelIds
                      ?.filter((l) => !HIDDEN_LABELS.has(l))
                      .slice(0, 3)
                      .map((label) => (
                        <span
                          key={label}
                          className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                        >
                          {formatLabel(label)}
                        </span>
                      ))}
                  </div>
                  <p className="truncate text-xs text-zinc-500">{email.from}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {formatDate(email.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for fetched emails */}
      {!fetching && fetchedEmails.length === 0 && (
        <div className="rounded border border-dashed border-zinc-300 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Click &quot;Fetch&quot; to load emails from Gmail
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Emails are stored locally in your browser
          </p>
        </div>
      )}

      {/* Processing History */}
      <div className="flex-1 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            History ({logs.length})
          </span>
        </div>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No emails processed yet
          </p>
        ) : (
          <div className="max-h-[250px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-zinc-500">
                    Subject
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-zinc-500">
                    Prompt
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-zinc-500">
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
                    <td className="px-3 py-1.5">
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {log.emailSubject || "(No Subject)"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-zinc-500">
                      {log.promptName || "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge
                        variant={
                          log.status === "processed" ? "success" : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 text-zinc-400">
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
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewEmail(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-white">
                  {previewEmail.subject || "(No Subject)"}
                </p>
                <p className="text-xs text-zinc-500">{previewEmail.from}</p>
                <p className="text-xs text-zinc-400">
                  {formatDate(previewEmail.date)}
                </p>
                {previewEmail.labelIds?.filter((l) => !HIDDEN_LABELS.has(l))
                  .length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {previewEmail.labelIds
                      .filter((l) => !HIDDEN_LABELS.has(l))
                      .map((label) => (
                        <span
                          key={label}
                          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                        >
                          {formatLabel(label)}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-800"
              dangerouslySetInnerHTML={{
                __html:
                  previewEmail.body || previewEmail.snippet || "No content",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
