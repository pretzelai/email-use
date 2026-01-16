"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Please sign in to continue</p>
        <Link href="/sign-in">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome back, {session.user.name || "there"}!
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Here&apos;s an overview of your email processing setup.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gmail Connection</CardTitle>
            <CardDescription>Connect your Gmail account</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full">
                Connect Gmail
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
            <CardDescription>Manage your AI prompts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/prompts">
              <Button variant="outline" className="w-full">
                View Prompts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
            <CardDescription>View processed emails</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/logs">
              <Button variant="outline" className="w-full">
                View Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started in 3 easy steps</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong className="text-zinc-900 dark:text-white">
                Connect your Gmail
              </strong>{" "}
              - Go to Settings and connect your Google account to grant email
              access.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">
                Create a prompt
              </strong>{" "}
              - Define how you want your emails processed using AI.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">
                Sync and process
              </strong>{" "}
              - Click sync to fetch new emails and run them through your
              prompts.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
