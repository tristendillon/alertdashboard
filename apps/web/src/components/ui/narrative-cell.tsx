"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Cell, CellContent, CellAction, type CellProps } from "./cell";
import { cn } from "@/utils/ui";

interface NarrativeCellProps extends Omit<CellProps, "variant" | "asChild"> {
  text: string | null | undefined;
  maxLength?: number;
  emptyText?: string;
}

export function NarrativeCell({
  text,
  maxLength = 100,
  emptyText = "No description",
  className,
  ...props
}: NarrativeCellProps) {
  const [expanded, setExpanded] = React.useState(false);

  const content = text?.trim() || emptyText;
  const shouldTruncate = content.length > maxLength;
  const displayText = expanded || !shouldTruncate 
    ? content 
    : `${content.slice(0, maxLength)}...`;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const isEmpty = !text?.trim();

  return (
    <Cell 
      variant={shouldTruncate ? "expandable" : "default"}
      className={cn(
        "items-start py-2",
        isEmpty && "text-muted-foreground italic",
        className
      )}
      {...props}
    >
      <CellContent 
        truncate={false} 
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed",
          !expanded && shouldTruncate && "line-clamp-3"
        )}
        title={shouldTruncate ? content : undefined}
      >
        {displayText}
      </CellContent>
      {shouldTruncate && (
        <CellAction>
          <button
            onClick={handleToggle}
            className="flex items-center justify-center p-1 rounded hover:bg-muted"
            aria-label={expanded ? "Collapse text" : "Expand text"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </CellAction>
      )}
    </Cell>
  );
}