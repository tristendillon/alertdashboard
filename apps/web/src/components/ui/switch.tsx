"use client";

import * as React from "react";

import { cn } from "@/utils/ui";

interface SwitchProps
  extends Omit<React.ComponentProps<"button">, "onChange" | "value"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Minimal dependency-free switch (no @radix-ui/react-switch in the tree).
function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "focus-visible:ring-ring peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-input",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

export { Switch };
