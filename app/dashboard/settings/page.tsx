"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";

interface GmailStatus {
  connected: boolean;
  email?: string;
  lastSync?: string;
}

function SettingsAlerts() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <>
      {success === "gmail_connected" && (
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Gmail connected successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error === "gmail_denied"
              ? "Gmail access was denied."
              : error === "no_tokens"
                ? "Failed to get Gmail access tokens."
                : "Failed to connect Gmail. Please try again."}
          </p>
        </div>
      )}
    </>
  );
}

function SettingsContent() {
  const { data: session } = useSession();
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch("/api/gmail/status");
      if (res.ok) {
        const data = await res.json();
        setGmailStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch Gmail status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail?")) return;

    setDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/status", { method: "DELETE" });
      if (res.ok) {
        setGmailStatus({ connected: false });
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Email
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Name
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {session?.user?.name || "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gmail Connection</CardTitle>
          <CardDescription>
            Connect your Gmail to process emails with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : gmailStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {gmailStatus.email}
                    </p>
                    <p className="text-sm text-zinc-500">Connected</p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? "Disconnecting..." : "Disconnect Gmail"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Connect your Gmail account to start processing emails with AI.
                We only read emails - we never send or modify them without your
                permission.
              </p>
              <a href="/api/gmail/connect">
                <Button>
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Connect Gmail
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure your AI provider API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            API keys are configured via environment variables on the server. If
            you&apos;re self-hosting, set <code>ANTHROPIC_API_KEY</code> and{" "}
            <code>OPENAI_API_KEY</code> in your environment.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Manage your account and connections.
        </p>
      </div>

      <Suspense fallback={null}>
        <SettingsAlerts />
      </Suspense>

      <SettingsContent />
    </div>
  );
}
