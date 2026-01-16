export function CodeExample() {
  const promptExample = `For each email:

- If it's from my team (@company.com), mark as important
- If it's a newsletter or marketing, archive immediately
- If someone is asking for a meeting, draft a polite reply
  asking for an agenda first
- If it contains an invoice or receipt, label as "Finance"
- If it's from a recruiter, archive and mark as read`;

  const responseExample = `Email: "Quick sync?" from sarah@company.com
→ Marked as important
→ Drafted reply: "Happy to chat! Could you share
  a quick agenda so I can prepare?"

Email: "Your weekly digest" from news@techsite.io
→ Archived
→ No action needed

Email: "Invoice #4521" from billing@saas.com
→ Labeled "Finance"
→ Kept in inbox`;

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Your rules. Your language.
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Write conditions in plain English. Add clauses for senders,
            subjects, content - whatever you need. AI handles the rest.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Your Rules
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-zinc-500">your-rules.txt</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm text-zinc-300">
                <code>{promptExample}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                What Happens
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-zinc-500">actions-taken</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm text-zinc-300">
                <code>{responseExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
