"use client";

import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import { Button, type buttonVariants } from "./button";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";

interface DismissButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function DismissButton({ className, ...props }: DismissButtonProps) {
  const { dismissDispatch, dispatch } = useActiveDispatch();
  if (!dispatch) {
    return null;
  }
  return (
    <div className={cn("flex w-full items-center justify-end pr-4", className)}>
      <Button onClick={dismissDispatch} {...props}>
        Dismiss
      </Button>
    </div>
  );
}
