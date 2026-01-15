import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "xs" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200":
              variant === "default",
            "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700":
              variant === "secondary",
            "border border-zinc-300 bg-transparent hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800":
              variant === "outline",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700":
              variant === "destructive",
          },
          {
            "h-8 px-3 text-sm": size === "default",
            "h-7 px-2.5 text-sm": size === "sm",
            "h-6 px-2 text-xs": size === "xs",
            "h-10 px-4 text-base": size === "lg",
            "h-8 w-8": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
