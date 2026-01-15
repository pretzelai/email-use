"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS, type AIProvider } from "@/lib/ai";
import type { Prompt, TestingEmail } from "@/lib/db/schema";

interface TestResult {
  emailId: string;
  subject: string;
  from: string;
  aiResponse: string;
  toolCalls: Array<{ toolName: string; args: Record<string, unknown> }>;
  status: "success" | "failed";
  error?: string;
}

interface TestingItem {
  email: TestingEmail;
  status: "loading" | "done";
  result?: TestResult;
}

export default function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Prompt state
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [provider, setProvider] = useState<AIProvider>("anthropic");
  const [model, setModel] = useState<string>(AVAILABLE_MODELS.anthropic[0].id);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Skip filters
  const [skipArchived, setSkipArchived] = useState(true);
  const [skipRead, setSkipRead] = useState(true);
  const [skipLabeled, setSkipLabeled] = useState(true);
  const [skipStarred, setSkipStarred] = useState(false);
  const [skipImportant, setSkipImportant] = useState(false);

  // Testing state
  const [testingEmails, setTestingEmails] = useState<TestingEmail[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [testingItems, setTestingItems] = useState<TestingItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(420);
  const [promptHeight, setPromptHeight] = useState(192);
  const [emailsHeight, setEmailsHeight] = useState(192);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingHorizontal = useRef(false);
  const isDraggingPrompt = useRef(false);
  const isDraggingEmails = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promptRes, emailsRes] = await Promise.all([
          fetch(`/api/prompts?id=${id}`),
          fetch("/api/testing-emails"),
        ]);

        if (promptRes.ok) {
          const p = await promptRes.json();
          setPrompt(p);
          setName(p.name);
          setDescription(p.description || "");
          setPromptText(p.promptText);
          setProvider(p.provider as AIProvider);
          setModel(p.model);
          setIsActive(p.isActive ?? true);
          setIsPublished(p.isPublished ?? false);
          // Skip filters
          setSkipArchived(p.skipArchived ?? true);
          setSkipRead(p.skipRead ?? true);
          setSkipLabeled(p.skipLabeled ?? true);
          setSkipStarred(p.skipStarred ?? false);
          setSkipImportant(p.skipImportant ?? false);
        }

        if (emailsRes.ok) {
          setTestingEmails(await emailsRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Mouse handlers for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingHorizontal.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      setRightPanelWidth(Math.max(280, Math.min(700, newWidth)));
    }
    if (isDraggingPrompt.current) {
      e.preventDefault();
      setPromptHeight((prev) => {
        const delta = e.movementY;
        return Math.max(100, Math.min(500, prev + delta));
      });
    }
    if (isDraggingEmails.current) {
      e.preventDefault();
      setEmailsHeight((prev) => {
        const delta = e.movementY;
        return Math.max(100, Math.min(500, prev + delta));
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingHorizontal.current = false;
    isDraggingPrompt.current = false;
    isDraggingEmails.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startHorizontalDrag = () => {
    isDraggingHorizontal.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startPromptDrag = () => {
    isDraggingPrompt.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const startEmailsDrag = () => {
    isDraggingEmails.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(AVAILABLE_MODELS[newProvider][0].id);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/prompts?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          promptText,
          provider,
          model,
          isActive,
          skipArchived,
          skipRead,
          skipLabeled,
          skipStarred,
          skipImportant,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setPrompt(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    setPublishLoading(true);

    try {
      const res = await fetch(`/api/prompts/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (res.ok) {
        setIsPublished(!isPublished);
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === testingEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(testingEmails.map((e) => e.id)));
    }
  };

  const handleTestSelected = async () => {
    if (selectedIds.size === 0) return;

    const emailsToTest = testingEmails.filter((e) => selectedIds.has(e.id));
    const newItems: TestingItem[] = emailsToTest.map((email) => ({
      email,
      status: "loading",
    }));

    setTestingItems((prev) => {
      const filtered = prev.filter(
        (item) => !selectedIds.has(item.email.id)
      );
      return [...newItems, ...filtered];
    });

    try {
      const res = await fetch(`/api/prompts/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        const resultsMap = new Map<string, TestResult>();
        data.results.forEach((r: TestResult) => {
          resultsMap.set(r.emailId, r);
        });

        setTestingItems((prev) =>
          prev.map((item) => {
            const result = resultsMap.get(item.email.id);
            if (result) {
              return { ...item, status: "done", result };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error("Test failed:", err);
      setTestingItems((prev) =>
        prev.map((item) => {
          if (item.status === "loading" && selectedIds.has(item.email.id)) {
            return {
              ...item,
              status: "done",
              result: {
                emailId: item.email.id,
                subject: item.email.subject,
                from: item.email.fromAddress,
                aiResponse: "",
                toolCalls: [],
                status: "failed",
                error: "Request failed",
              },
            };
          }
          return item;
        })
      );
    }
  };

  const toggleExpanded = (emailId: string) => {
    const next = new Set(expandedIds);
    if (next.has(emailId)) {
      next.delete(emailId);
    } else {
      next.add(emailId);
    }
    setExpandedIds(next);
  };

  const clearResults = () => {
    setTestingItems([]);
    setExpandedIds(new Set());
  };

  const isAnyLoading = testingItems.some((item) => item.status === "loading");

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
        Prompt not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/prompts"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            ← Back
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <h1 className="text-base font-medium text-zinc-900 dark:text-white">
            {name || "Untitled"}
          </h1>
          <Badge variant={isPublished ? "success" : "warning"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePublishToggle}
            disabled={publishLoading}
          >
            {publishLoading ? "..." : isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Main content - Split view */}
      <div ref={containerRef} className="mt-3 flex flex-1 gap-0 overflow-hidden">
        {/* Left Panel - Form & Testing Emails */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {/* Settings */}
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-zinc-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) =>
                      handleProviderChange(e.target.value as AIProvider)
                    }
                    className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {AVAILABLE_MODELS[provider].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Skip Filters */}
              <div>
                <label className="text-xs text-zinc-500">
                  Skip emails that are:
                </label>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={skipArchived}
                      onChange={(e) => setSkipArchived(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Archived
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={skipRead}
                      onChange={(e) => setSkipRead(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Read
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={skipLabeled}
                      onChange={(e) => setSkipLabeled(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Already labeled
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={skipStarred}
                      onChange={(e) => setSkipStarred(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Starred
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={skipImportant}
                      onChange={(e) => setSkipImportant(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    Important
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Text */}
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <label className="text-xs text-zinc-500">Prompt</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{ height: promptHeight }}
              className="mt-1 w-full resize-none rounded border border-zinc-200 bg-white p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Enter your prompt here..."
            />
          </div>

          {/* Draggable divider for prompt height */}
          <div
            onMouseDown={startPromptDrag}
            className="group relative z-10 flex h-3 cursor-row-resize items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <div className="h-1 w-12 rounded-full bg-zinc-300 group-hover:bg-zinc-400 dark:bg-zinc-600" />
          </div>

          {/* Testing Emails */}
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  Testing Emails ({testingEmails.length})
                </span>
                {testingEmails.length > 0 && (
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <input
                      type="checkbox"
                      checked={
                        testingEmails.length > 0 &&
                        selectedIds.size === testingEmails.length
                      }
                      onChange={handleSelectAll}
                      className="h-3 w-3 rounded border-zinc-300"
                    />
                    Select all
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/prompts/testing-emails">
                  <Button size="xs" variant="outline">
                    + Add
                  </Button>
                </Link>
                <Button
                  size="xs"
                  onClick={handleTestSelected}
                  disabled={selectedIds.size === 0 || isAnyLoading}
                >
                  {isAnyLoading ? "Testing..." : `Test (${selectedIds.size})`}
                </Button>
              </div>
            </div>

            {testingEmails.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">
                No testing emails.{" "}
                <Link
                  href="/dashboard/prompts/testing-emails"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Add some
                </Link>
              </p>
            ) : (
              <div
                style={{ maxHeight: emailsHeight }}
                className="divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800"
              >
                {testingEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center gap-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(email.id)}
                      onChange={() => handleSelectEmail(email.id)}
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                        {email.subject}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {email.fromAddress}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draggable divider for emails height */}
          <div
            onMouseDown={startEmailsDrag}
            className="group relative z-10 mt-1 flex h-3 cursor-row-resize items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <div className="h-1 w-12 rounded-full bg-zinc-300 group-hover:bg-zinc-400 dark:bg-zinc-600" />
          </div>
        </div>

        {/* Horizontal Resizer */}
        <div
          onMouseDown={startHorizontalDrag}
          className="group flex w-2 cursor-col-resize items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <div className="h-8 w-0.5 rounded-full bg-zinc-300 group-hover:bg-zinc-400 dark:bg-zinc-600" />
        </div>

        {/* Right Panel - Test Results */}
        <div
          style={{ width: rightPanelWidth }}
          className="flex-shrink-0 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Test Results ({testingItems.length})
            </span>
            {testingItems.length > 0 && (
              <button
                onClick={clearResults}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Clear
              </button>
            )}
          </div>
          <div className="h-full overflow-y-auto p-3 pb-16">
            {testingItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                Select emails and click &quot;Test&quot; to see results
              </p>
            ) : (
              <div className="space-y-3">
                {testingItems.map((item) => {
                  const isExpanded = expandedIds.has(item.email.id);

                  return (
                    <div
                      key={item.email.id}
                      className="rounded border border-zinc-200 dark:border-zinc-700"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {item.email.subject}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {item.email.fromAddress}
                          </p>
                        </div>
                        {item.status === "loading" ? (
                          <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                        ) : (
                          <Badge
                            variant={
                              item.result?.status === "success"
                                ? "success"
                                : "destructive"
                            }
                          >
                            {item.result?.status}
                          </Badge>
                        )}
                      </div>

                      {/* Expandable Original Email */}
                      <div className="border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={() => toggleExpanded(item.email.id)}
                          className="flex w-full items-center gap-1 px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <span
                            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            ▶
                          </span>
                          Original Email
                        </button>
                        {isExpanded && (
                          <div className="border-t border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/30">
                            <div
                              className="prose prose-xs dark:prose-invert max-h-48 max-w-none overflow-y-auto text-xs text-zinc-600 dark:text-zinc-400"
                              dangerouslySetInnerHTML={{
                                __html:
                                  item.email.body ||
                                  item.email.snippet ||
                                  "No content",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Result Content */}
                      {item.status === "done" && item.result && (
                        <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
                          {item.result.error ? (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {item.result.error}
                            </p>
                          ) : (
                            <>
                              {item.result.aiResponse && (
                                <div className="mb-2">
                                  <p className="text-xs text-zinc-500">
                                    Response
                                  </p>
                                  <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                                    {item.result.aiResponse.slice(0, 300)}
                                    {item.result.aiResponse.length > 300 &&
                                      "..."}
                                  </p>
                                </div>
                              )}

                              {item.result.toolCalls.length > 0 && (
                                <div>
                                  <p className="text-xs text-zinc-500">Tools</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {item.result.toolCalls.map((tc, i) => (
                                      <span
                                        key={i}
                                        className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                                      >
                                        {tc.toolName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Loading state content */}
                      {item.status === "loading" && (
                        <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                            Processing with AI...
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
