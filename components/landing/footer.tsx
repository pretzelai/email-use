import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
              <svg
                className="h-5 w-5 text-white dark:text-zinc-900"
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
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">
              email-use
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href="https://github.com/yourusername/email-use"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              GitHub
            </a>
            <Link
              href="/privacy"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Terms
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
