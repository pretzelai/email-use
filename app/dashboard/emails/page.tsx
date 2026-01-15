"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmailLogTable,
  EmailLogDetail,
} from "@/components/dashboard/email-log-table";
import { formatDate } from "@/lib/utils";

const STORAGE_KEY = "email-use-fetched-emails";

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

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  model: string;
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
  const [emailCount, setEmailCount] = useState(10);

  // For email selection and processing
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(
    new Set()
  );
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Load emails from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FetchedEmail[];
        if (parsed.length > 0) {
          setFetchedEmails(parsed);
          setShowPreview(true);
        }
      }
    } catch (error) {
      console.error("Failed to load emails from localStorage:", error);
    }
  }, []);

  // Save emails to localStorage when they change
  const saveEmailsToStorage = useCallback((emails: FetchedEmail[]) => {
    try {
      if (emails.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save emails to localStorage:", error);
    }
  }, []);

  const clearStoredEmails = useCallback(() => {
    setFetchedEmails([]);
    setSelectedEmailIds(new Set());
    setProcessResults([]);
    setShowResults(false);
    setShowPreview(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

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

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPrompts();
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
    setSelectedEmailIds(new Set());
    setProcessResults([]);
    setShowResults(false);

    try {
      const res = await fetch(`/api/emails/fetch?limit=${emailCount}`);
      const data = await res.json();

      if (res.ok) {
        setFetchedEmails(data);
        saveEmailsToStorage(data);
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

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmailIds);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmailIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmailIds.size === fetchedEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(fetchedEmails.map((e) => e.id)));
    }
  };

  const handleProcessSelected = async () => {
    if (selectedEmailIds.size === 0) {
      alert("Please select at least one email");
      return;
    }
    if (!selectedPromptId) {
      alert("Please select a prompt");
      return;
    }

    setProcessing(true);
    setShowResults(true);
    setProcessResults([]);

    const emailsToProcess = fetchedEmails.filter((e) =>
      selectedEmailIds.has(e.id)
    );

    try {
      const res = await fetch("/api/emails/process-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: emailsToProcess.map((e) => ({
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
        fetchLogs(); // Refresh logs after processing
      } else {
        alert(data.error || "Failed to process emails");
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Failed to process emails");
    } finally {
      setProcessing(false);
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
            Email Processing
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Fetch emails, select which to process, and run AI prompts with
            tools.
          </p>
        </div>
      </div>

      {/* Fetch Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fetch Emails</CardTitle>
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
                  Fetch Emails
                </>
              )}
            </Button>
            {fetchedEmails.length > 0 && (
              <Button variant="outline" onClick={clearStoredEmails}>
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
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Clear Emails
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <svg
              className="mr-1 inline-block h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
              />
            </svg>
            Fetched emails are stored locally in your browser (localStorage). They are never sent to our servers until you choose to process them. Clear your browser data or click &quot;Clear Emails&quot; to remove them.
          </p>

          {/* Collapsed state indicator */}
          {fetchedEmails.length > 0 && !showPreview && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {fetchedEmails.length}
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  emails stored locally
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>Click to expand</span>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Email Selection & Processing */}
      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">
              Select Emails to Process ({fetchedEmails.length} fetched)
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">
                Stored locally in your browser
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                title="Collapse (emails remain stored)"
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
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </Button>
            </div>
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
              <>
                {/* Selection Controls */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedEmailIds.size === fetchedEmails.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Select All ({selectedEmailIds.size} selected)
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="">Select a prompt...</option>
                      {prompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name} ({prompt.provider}/{prompt.model})
                        </option>
                      ))}
                    </select>

                    <Button
                      onClick={handleProcessSelected}
                      disabled={
                        processing ||
                        selectedEmailIds.size === 0 ||
                        !selectedPromptId
                      }
                    >
                      {processing ? (
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
                          Processing...
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
                              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                            />
                          </svg>
                          Process Selected
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Email List with Checkboxes */}
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {fetchedEmails.map((email) => (
                    <div
                      key={email.id}
                      className="-mx-6 flex items-start gap-3 px-6 py-4 transition-colors first:pt-0 last:pb-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmailIds.has(email.id)}
                        onChange={() => handleSelectEmail(email.id)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {showResults && processResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processResults.map((result) => (
                <div
                  key={result.emailId}
                  className={`rounded-lg border p-4 ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-zinc-900 dark:text-white">
                      {result.subject}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        result.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  {result.error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {result.error}
                    </p>
                  ) : (
                    <>
                      {/* AI Response */}
                      {result.aiResponse && (
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                            AI Response
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                            {result.aiResponse}
                          </p>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {result.toolCalls && result.toolCalls.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                            Tools Called
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.toolCalls.map((tc, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-mono dark:bg-zinc-700"
                              >
                                {tc.toolName}
                                {Object.keys(tc.args).length > 0 && (
                                  <span className="ml-1 text-zinc-500">
                                    ({Object.keys(tc.args).join(", ")})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Executed Actions */}
                      {result.executedActions &&
                        result.executedActions.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                              Actions Executed
                            </p>
                            <div className="space-y-1">
                              {result.executedActions.map((action, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  {action.result.success ? (
                                    <svg
                                      className="h-4 w-4 text-green-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4 text-red-500"
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
                                  )}
                                  <span className="font-mono">{action.tool}</span>
                                  {Object.keys(action.args).length > 0 && (
                                    <span className="text-zinc-500">
                                      {JSON.stringify(action.args)}
                                    </span>
                                  )}
                                  {action.result.error && (
                                    <span className="text-red-500">
                                      - {action.result.error}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Sync Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Sync (Legacy)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleSync} disabled={syncing} variant="outline">
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
                  Auto Sync & Process All
                </>
              )}
            </Button>
            <p className="text-sm text-zinc-500">
              Processes all unread emails with all active prompts (no tool
              execution)
            </p>
          </div>
          {syncResult && (
            <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Sync complete: {syncResult.processed} processed,{" "}
                {syncResult.failed} failed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Logs History */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          Processing History
        </h2>
        <EmailLogTable logs={logs} onViewDetails={setSelectedLog} />
      </div>

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
