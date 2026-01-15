import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = {
  title: "Terms of Service - email-use",
  description: "Terms of service for email-use email processing application",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
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
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              email-use
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
          <div className="mb-10 border-b border-zinc-200 pb-8 dark:border-zinc-700">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-12">
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              Please read these Terms of Service carefully before using
              email-use. By using the Service, you agree to be bound by these
              Terms.
            </p>

            <Section number="1" title="Description of Service">
              <p>
                email-use is an email processing application that allows you to
                connect your Gmail account and process emails using AI models
                from providers like Anthropic (Claude) and OpenAI (GPT). The
                Service enables you to create custom prompts that define how
                your emails should be analyzed and processed.
              </p>
            </Section>

            <Section number="2" title="Account Registration">
              <p>
                To use the Service, you must sign in using your Google account.
                You are responsible for maintaining the security of your account
                and for all activities that occur under your account. You must
                notify us immediately of any unauthorized use.
              </p>
            </Section>

            <Section number="3" title="Gmail Access">
              <p>By connecting your Gmail account, you:</p>
              <List
                items={[
                  "Grant us permission to read your emails for processing purposes",
                  "Acknowledge that email content will be sent to third-party AI providers",
                  "Understand that you can revoke access at any time through your Google Account settings or our Settings page",
                ]}
              />
            </Section>

            <Section number="4" title="AI Provider Usage">
              <p>
                The Service uses third-party AI providers (Anthropic and OpenAI)
                to process your emails. By using the Service, you agree to:
              </p>
              <List
                items={[
                  "Comply with the terms of service of these AI providers",
                  "Not use the Service to process content that violates their usage policies",
                  "Understand that AI responses are generated automatically and may not always be accurate",
                ]}
              />
            </Section>

            <Section number="5" title="API Keys (Self-Hosted)">
              <InfoBox variant="amber">
                If you self-host email-use, you must provide your own API keys
                for AI providers. You are responsible for securing your API
                keys, any costs incurred from API usage, and complying with the
                AI providers&apos; terms of service.
              </InfoBox>
            </Section>

            <Section number="6" title="Acceptable Use">
              <p>
                You agree{" "}
                <strong className="text-zinc-900 dark:text-white">not</strong>{" "}
                to use the Service to:
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Process emails containing illegal content",
                  "Violate any applicable laws or regulations",
                  "Infringe on the rights of others",
                  "Attempt to gain unauthorized access",
                  "Interfere with or disrupt the Service",
                  "Violate the privacy of third parties",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
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
                    <span className="text-sm text-red-800 dark:text-red-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section number="7" title="Intellectual Property">
              <p>
                email-use is open source software released under the{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">
                  MIT License
                </span>
                . You are free to use, modify, and distribute the software in
                accordance with the license terms.
              </p>
            </Section>

            <Section number="8" title="Disclaimer of Warranties">
              <LegalBox>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </LegalBox>
              <p className="mt-4">We do not warrant that:</p>
              <List
                items={[
                  "The Service will be uninterrupted or error-free",
                  "AI-generated responses will be accurate, complete, or useful",
                  "The Service will meet your specific requirements",
                  "Any errors will be corrected",
                ]}
              />
            </Section>

            <Section number="9" title="Limitation of Liability">
              <LegalBox>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL
                email-use, ITS OPERATORS, OR CONTRIBUTORS BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR
                USE.
              </LegalBox>
            </Section>

            <Section number="10" title="Data Processing">
              <p>
                When you use the Service, your email content is processed by AI
                providers. You acknowledge that:
              </p>
              <List
                items={[
                  "Email content is transmitted to third-party AI services",
                  "AI providers may have different data retention policies",
                  "You should not process highly sensitive or confidential information without understanding the risks",
                ]}
              />
            </Section>

            <Section number="11" title="Service Modifications & Termination">
              <p>
                We reserve the right to modify, suspend, or discontinue the
                Service at any time, with or without notice. We may terminate or
                suspend your access to the Service immediately for any reason,
                including breach of these Terms.
              </p>
            </Section>

            <Section number="12" title="Open Source">
              <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <svg
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Open Source on GitHub
                  </p>
                  <a
                    href="https://github.com/pretzelai/email-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    github.com/pretzelai/email-use
                  </a>
                </div>
              </div>
            </Section>

            <Section number="13" title="Contact">
              <p>
                If you have any questions about these Terms, please open an
                issue on our{" "}
                <a
                  href="https://github.com/pretzelai/email-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900 dark:text-white dark:decoration-zinc-600 dark:hover:decoration-white"
                >
                  GitHub repository
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 pl-11 text-zinc-600 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2 pl-5">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-2 before:absolute before:-left-3 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-zinc-300 dark:before:bg-zinc-600"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function InfoBox({
  variant,
  children,
}: {
  variant: "blue" | "amber";
  children: React.ReactNode;
}) {
  const styles = {
    blue: "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
    amber:
      "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200",
  };
  return (
    <div className={`rounded-xl border-l-4 p-5 ${styles[variant]}`}>
      {children}
    </div>
  );
}

function LegalBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Legal Notice
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </p>
    </div>
  );
}
