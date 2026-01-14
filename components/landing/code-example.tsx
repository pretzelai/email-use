export function CodeExample() {
  const promptExample = `You are an email assistant. For each email:

1. Categorize it (important, newsletter, spam, action-required)
2. Extract key action items if any
3. Suggest a brief response if needed

Be concise and actionable.`;

  const responseExample = `{
  "category": "action-required",
  "summary": "Meeting request from Sarah for Q4 planning",
  "action_items": [
    "Respond to confirm Thursday 2pm availability",
    "Prepare Q3 metrics for discussion"
  ],
  "suggested_reply": "Hi Sarah, Thursday 2pm works for me..."
}`;

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Write prompts, get results
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Define how you want your emails processed. The AI handles the rest.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Your Prompt
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-zinc-500">prompt.txt</span>
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
                AI Response
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-zinc-500">response.json</span>
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
