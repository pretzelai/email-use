import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/email-use-icon.png"
              alt="email-use logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-semibold text-zinc-900 dark:text-white">
              email-use
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href="https://github.com/pretzelai/email-use"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              GitHub
            </a>
            <Link
              href="/privacy-policy"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Terms of Service
            </Link>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            MIT License. Open Source.
          </p>
        </div>
      </div>
    </footer>
  );
}
