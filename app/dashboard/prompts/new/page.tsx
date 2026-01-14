import { PromptForm } from "@/components/dashboard/prompt-form";

export default function NewPromptPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PromptForm mode="create" />
    </div>
  );
}
