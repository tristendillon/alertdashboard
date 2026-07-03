"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./badge";
import { Cell, CellContent, CellAction, type CellProps } from "./cell";
import { cn } from "@/utils/ui";

interface ArrayCellProps extends Omit<CellProps, "variant" | "asChild"> {
  items: string[];
  maxVisible?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  expandable?: boolean;
}

export function ArrayCell({
  items,
  maxVisible = 2,
  badgeVariant = "secondary",
  expandable = true,
  className,
  ...props
}: ArrayCellProps) {
  const [expanded, setExpanded] = React.useState(false);

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;
  const remainingCount = items.length - maxVisible;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Cell 
      variant={expandable && hasMore ? "expandable" : "default"}
      className={cn("gap-1", className)}
      {...props}
    >
      <CellContent truncate={false} className="flex flex-wrap items-center gap-1">
        {visibleItems.map((item, index) => (
          <Badge 
            key={`${item}-${index}`}
            variant={badgeVariant}
            className="text-xs"
          >
            {item}
          </Badge>
        ))}
        {hasMore && !expanded && (
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-muted"
            onClick={expandable ? handleToggleExpand : undefined}
          >
            +{remainingCount}
          </Badge>
        )}
      </CellContent>
      {expandable && hasMore && (
        <CellAction>
          <button
            onClick={handleToggleExpand}
            className="flex items-center justify-center p-1 rounded hover:bg-muted"
            aria-label={expanded ? "Collapse items" : "Expand items"}
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