"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Cell, CellContent, CellAction, type CellProps } from "./cell";
import { cn } from "@/utils/ui";
import { toast } from "sonner";

interface JsonCellProps extends Omit<CellProps, "variant" | "asChild"> {
  data: Record<string, unknown> | null | undefined;
  maxPreviewKeys?: number;
  emptyText?: string;
}

export function JsonCell({
  data,
  maxPreviewKeys = 2,
  emptyText = "No data",
  className,
  ...props
}: JsonCellProps) {
  const [expanded, setExpanded] = React.useState(false);

  const isEmpty = !data || Object.keys(data).length === 0;
  const jsonString = data ? JSON.stringify(data, null, 2) : "";

  const previewText = React.useMemo(() => {
    if (isEmpty) return emptyText;

    const keys = Object.keys(data);
    if (keys.length <= maxPreviewKeys) {
      return keys
        .map((key) => `${key}: ${JSON.stringify(data[key])}`)
        .join(", ");
    }

    const visibleKeys = keys.slice(0, maxPreviewKeys);
    const remainingCount = keys.length - maxPreviewKeys;
    const preview = visibleKeys
      .map((key) => `${key}: ${JSON.stringify(data[key])}`)
      .join(", ");

    return `${preview}, +${remainingCount} more`;
  }, [data, maxPreviewKeys, emptyText, isEmpty]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("JSON copied to clipboard");
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  if (isEmpty) {
    return (
      <Cell
        className={cn("text-muted-foreground italic", className)}
        {...props}
      >
        <CellContent>{emptyText}</CellContent>
      </Cell>
    );
  }

  return (
    <Cell
      variant="expandable"
      className={cn("items-start py-2", className)}
      {...props}
    >
      <CellContent truncate={false} className="min-w-0">
        {expanded ? (
          <pre className="bg-muted/50 overflow-x-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
            {jsonString}
          </pre>
        ) : (
          <div className="truncate text-sm" title={previewText}>
            {previewText}
          </div>
        )}
      </CellContent>
      <CellAction className="flex-col gap-1">
        <button
          onClick={handleToggle}
          className="hover:bg-muted flex items-center justify-center rounded p-1"
          aria-label={expanded ? "Collapse JSON" : "Expand JSON"}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expanded && (
          <button
            onClick={handleCopy}
            className="hover:bg-muted flex items-center justify-center rounded p-1"
            aria-label="Copy JSON"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </CellAction>
    </Cell>
  );
}
