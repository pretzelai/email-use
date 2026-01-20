import { auth } from "@/lib/auth";
import { billing } from "@/lib/billing";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PricingPage } from "@/components/PricingPage";

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const apiCredits = await billing.credits.getBalance(userId, "email_processing");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Billing
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Manage your subscription and usage.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Email Processing
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your current credit balance
        </p>
        <div className="mt-4">
          <span className="text-4xl font-bold text-zinc-900 dark:text-white">
            {apiCredits.toLocaleString()}
          </span>
          <span className="ml-2 text-zinc-500 dark:text-zinc-400">
            credits remaining
          </span>
        </div>
      </div>

      <PricingPage />
    </div>
  );
}
