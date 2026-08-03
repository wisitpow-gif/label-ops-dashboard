"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free toggle switch (no @radix-ui/react-switch needed).
 * Controlled via `checked` / `onCheckedChange` to match the shadcn API.
 */
function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<React.ComponentProps<"button">, "onChange" | "type">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export { Switch };
