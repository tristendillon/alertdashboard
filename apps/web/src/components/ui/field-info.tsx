import { cn } from "@/utils/ui";
import type { AnyFieldApi } from "@tanstack/react-form";

interface FieldInfoProps {
  field: AnyFieldApi;
  className?: string;
}

export function FieldInfo({ field, className }: FieldInfoProps) {
  if (!field.state.meta.errors || field.state.meta.errors.length === 0)
    return null;

  const errorMessage = field.state.meta.errors[0];
  const displayMessage =
    typeof errorMessage === "string"
      ? errorMessage
      : (errorMessage?.message ?? "Invalid input");

  return (
    <p className={cn("text-destructive text-sm", className)}>
      {displayMessage}
    </p>
  );
}
