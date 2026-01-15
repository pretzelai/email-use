"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";

export function DashboardHeader() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="lg:hidden">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-zinc-900 dark:text-white"
        >
          email-use
        </Link>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {session?.user && (
          <>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {session.user.email}
            </span>
            <Button variant="ghost" size="xs" onClick={handleSignOut}>
              Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
