"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TestingEmail } from "@/lib/db/schema";

interface TestResult {
  emailId: string;
  subject: string;
  from: string;
  aiResponse: string;
  toolCalls: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
  status: "success" | "failed";
  error?: string;
}

interface PromptTestingSectionProps {
  promptId: string;
}

export function PromptTestingSection({ promptId }: PromptTestingSectionProps) {
  const [testingEmails, setTestingEmails] = useState<TestingEmail[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTestingEmails();
  }, []);

  const fetchTestingEmails = async () => {
    try {
      const res = await fetch("/api/testing-emails");
      if (res.ok) {
        const data = await res.json();
        setTestingEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch testing emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === testingEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(testingEmails.map((e) => e.id)));
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

  const handleClearAll = async () => {
    try {
      const res = await fetch("/api/testing-emails?clearAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setTestingEmails([]);
        setSelectedIds(new Set());
        setTestResults([]);
      }
    } catch (err) {
      console.error("Failed to clear testing emails:", err);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/testing-emails?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTestingEmails((prev) => prev.filter((e) => e.id !== id));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (err) {
      console.error("Failed to delete testing email:", err);
    }
  };

  const handleTestSelected = async () => {
    if (selectedIds.size === 0) return;

    setTesting(true);
    setError("");
    setTestResults([]);

    try {
      const res = await fetch(`/api/prompts/${promptId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to test prompt");
      }

      const data = await res.json();
      setTestResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-zinc-500">Loading testing emails...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Test Your Prompt</CardTitle>
              <CardDescription>
                Select testing emails to see how your prompt would process them.
                Tools will not be executed - this is a dry run.
              </CardDescription>
            </div>
            <Link href="/dashboard/prompts/testing-emails">
              <Button variant="outline" size="sm">
                Add Testing Emails
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {testingEmails.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <p className="text-zinc-500">No testing emails saved yet.</p>
              <Link
                href="/dashboard/prompts/testing-emails"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Add some emails to test with
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selection controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === testingEmails.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Select All ({testingEmails.length})
                  </label>
                  {selectedIds.size > 0 && (
                    <span className="text-sm text-zinc-500">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleTestSelected}
                    disabled={selectedIds.size === 0 || testing}
                  >
                    {testing ? "Testing..." : "Test Selected"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Email list */}
              <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
                {testingEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-start gap-3 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(email.id)}
                      onChange={() => handleSelectEmail(email.id)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {email.subject}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {email.fromAddress}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEmail(email.id)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      &times;
                    </Button>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
            <CardDescription>
              These are the results of the dry run. No actions were actually executed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <div
                key={result.emailId}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{result.subject}</p>
                    <p className="text-sm text-zinc-500">{result.from}</p>
                  </div>
                  <Badge
                    variant={result.status === "success" ? "success" : "destructive"}
                  >
                    {result.status}
                  </Badge>
                </div>

                {result.status === "failed" && result.error && (
                  <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    Error: {result.error}
                  </div>
                )}

                {result.status === "success" && (
                  <>
                    {/* AI Response */}
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                        AI Response
                      </p>
                      <div className="rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
                        {result.aiResponse || "(No text response)"}
                      </div>
                    </div>

                    {/* Tool Calls */}
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                        Tools That Would Be Called
                      </p>
                      {result.toolCalls.length === 0 ? (
                        <p className="text-sm text-zinc-500">No tools called</p>
                      ) : (
                        <div className="space-y-2">
                          {result.toolCalls.map((tc, idx) => (
                            <div
                              key={idx}
                              className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20"
                            >
                              <p className="font-mono text-sm font-medium text-blue-700 dark:text-blue-400">
                                {tc.toolName}
                              </p>
                              <pre className="mt-1 overflow-x-auto text-xs text-blue-600 dark:text-blue-300">
                                {JSON.stringify(tc.args, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
