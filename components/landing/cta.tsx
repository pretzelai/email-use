import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-20 dark:bg-zinc-800 sm:px-12 sm:py-28">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to automate your inbox?
            </h2>
            <p className="mt-4 text-lg text-zinc-300">
              Start processing emails with AI in minutes. No credit card
              required.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full bg-white text-zinc-900 hover:bg-zinc-100 sm:w-auto"
                >
                  Start for Free
                </Button>
              </Link>
              <a
                href="https://github.com/yourusername/email-use"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-zinc-600 text-white hover:bg-zinc-800 sm:w-auto"
                >
                  Self-Host Guide
                </Button>
              </a>
            </div>
          </div>

          {/* Background decoration */}
          <div
            className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
