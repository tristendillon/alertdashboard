"use client";

import * as React from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Cell, CellContent, CellAction, type CellProps } from "./cell";
import { cn } from "@/utils/ui";
import { toast } from "sonner";

interface RegexCellProps extends Omit<CellProps, "variant" | "asChild"> {
  pattern: string;
  emptyText?: string;
  showValidation?: boolean;
}

export function RegexCell({
  pattern,
  emptyText = "No pattern",
  showValidation = true,
  className,
  ...props
}: RegexCellProps) {
  const [copied, setCopied] = React.useState(false);

  const validation = React.useMemo(() => {
    if (!pattern || !showValidation) return null;
    
    try {
      new RegExp(pattern);
      return { isValid: true, error: null };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : "Invalid regex"
      };
    }
  }, [pattern, showValidation]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(pattern);
      setCopied(true);
      toast.success("Pattern copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy pattern");
    }
  };

  if (!pattern) {
    return (
      <Cell className={cn("text-muted-foreground italic", className)} {...props}>
        <CellContent>
          {emptyText}
        </CellContent>
      </Cell>
    );
  }

  return (
    <Cell 
      variant="interactive"
      align="between"
      className={className}
      onClick={handleCopy}
      title={
        validation?.isValid 
          ? "Click to copy regex pattern" 
          : `Invalid regex: ${validation?.error}`
      }
      {...props}
    >
      <CellContent className="flex items-center gap-2">
        <code className={cn(
          "text-sm font-mono bg-muted/50 px-2 py-1 rounded",
          validation && !validation.isValid && "bg-destructive/10 text-destructive"
        )}>
          {pattern}
        </code>
        {validation && !validation.isValid && (
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
        )}
      </CellContent>
      <CellAction>
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center transition-colors",
            copied ? "text-green-600" : "text-muted-foreground"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </div>
      </CellAction>
    </Cell>
  );
}