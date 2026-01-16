import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = {
  title: "Privacy Policy - email-use",
  description: "Privacy policy for email-use email processing application",
};

export default function PrivacyPage() {
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
              Privacy Policy
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
              email-use is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, and safeguard your
              information when you use our email processing service.
            </p>

            <Section number="1" title="Information We Collect">
              <Subsection title="Account Information">
                <p>When you sign up using Google OAuth, we collect:</p>
                <List
                  items={[
                    "Your name",
                    "Your email address",
                    "Your Google account ID (for authentication purposes)",
                  ]}
                />
              </Subsection>

              <Subsection title="Gmail Access">
                <p>
                  When you connect your Gmail account, we request read-only
                  access to your emails. We store OAuth tokens to maintain your
                  connection but{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    we do not permanently store the content of your emails
                  </strong>
                  .
                </p>
              </Subsection>

              <Subsection title="Processing Logs">
                <p>When emails are processed, we store:</p>
                <List
                  items={[
                    "Email ID (a unique identifier)",
                    "Timestamp of processing",
                    "Processing status (success or failure)",
                  ]}
                />
                <p className="mt-3">
                  By default, we do{" "}
                  <strong className="text-zinc-900 dark:text-white">not</strong>{" "}
                  store email subjects, snippets, or AI responses. This ensures
                  your email content remains private.
                </p>
                <p className="mt-3">
                  If you enable <strong>Debug Mode</strong> in Settings, we will
                  additionally store:
                </p>
                <List
                  items={[
                    "Email subject line",
                    "Sender address",
                    "A brief snippet of the email",
                    "The AI-generated response",
                  ]}
                />
                <p className="mt-3">
                  Debug mode is intended for troubleshooting and is disabled by
                  default. You can enable or disable it at any time in Settings.
                </p>
              </Subsection>

              <Subsection title="Testing Emails">
                <p>
                  If you choose to save emails as testing emails for prompt
                  testing, we store:
                </p>
                <List
                  items={[
                    "Email metadata (subject line, sender address)",
                    "Email snippet and full body content",
                    "Gmail message and thread IDs",
                    "Original email date",
                  ]}
                />
                <p className="mt-3">
                  Testing emails are{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    only saved when you explicitly choose to save them
                  </strong>
                  . They are used to test how your prompts will respond before
                  publishing them for automatic processing. You can delete
                  individual testing emails or clear all of them at any time.
                </p>
              </Subsection>
            </Section>

            <Section number="2" title="How We Use Your Information">
              <p>We use your information to:</p>
              <List
                items={[
                  "Authenticate you and maintain your session",
                  "Connect to your Gmail account and fetch emails for processing",
                  "Send email content to AI providers (Anthropic or OpenAI) based on your configured prompts",
                  "Store testing emails you save for prompt testing purposes",
                  "Display processing history and results",
                  "Improve our service",
                ]}
              />
            </Section>

            <Section number="3" title="Third-Party AI Providers">
              <p>
                When you process emails, the email content is sent to the AI
                provider you select (Anthropic or OpenAI). These providers have
                their own privacy policies:
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <ExternalLink
                  href="https://www.anthropic.com/privacy"
                  label="Anthropic Privacy Policy"
                />
                <ExternalLink
                  href="https://openai.com/privacy"
                  label="OpenAI Privacy Policy"
                />
              </div>
              <p className="mt-4">
                We recommend reviewing their policies to understand how they
                handle data.
              </p>
            </Section>

            <Section number="4" title="Data Storage and Security">
              <p>
                Your data is stored securely in our database. We implement
                industry-standard security measures to protect your information,
                including:
              </p>
              <List
                items={[
                  "Encrypted connections (HTTPS)",
                  "Secure token storage",
                  "Access controls and authentication",
                ]}
              />
            </Section>

            <Section number="5" title="Data Retention">
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        Data Type
                      </th>
                      <th className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        Retention Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    <tr>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Account data
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Until you delete your account
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Gmail tokens
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Until you disconnect Gmail or delete your account
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Processing logs
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Until you delete them or delete your account
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Testing emails
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        Until you delete them or delete your account
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section number="6" title="Your Rights">
              <p>You have the right to:</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <RightCard
                  title="Access"
                  description="View your personal data"
                />
                <RightCard
                  title="Delete"
                  description="Remove your account and all data"
                />
                <RightCard
                  title="Disconnect"
                  description="Remove Gmail access at any time"
                />
                <RightCard
                  title="Export"
                  description="Download your processing logs"
                />
              </div>
            </Section>

            <Section number="7" title="Self-Hosted Instances">
              <InfoBox variant="blue">
                email-use is open source and can be self-hosted. If you use a
                self-hosted instance, the operator of that instance is
                responsible for data handling and privacy compliance. This
                policy only applies to our official hosted service.
              </InfoBox>
            </Section>

            <Section number="8" title="Contact Us">
              <p>
                If you have questions about this Privacy Policy, please open an
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

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
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

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {label}
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
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

function RightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
      <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
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
