import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/email-use-icon.png"
            alt="email-use"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            email-use
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
