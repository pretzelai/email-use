import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "destructive" | "outline" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        {
          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900":
            variant === "default",
          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400":
            variant === "secondary",
          "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400":
            variant === "success",
          "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400":
            variant === "destructive",
          "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400":
            variant === "warning",
          "border border-zinc-200 dark:border-zinc-700": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
