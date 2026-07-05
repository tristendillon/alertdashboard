"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/ui";

export interface OverflowChipItem {
  key: string;
  label: string;
}

interface OverflowChipsProps {
  items: OverflowChipItem[];
  max?: number;
  onRemove?: (key: string) => void;
  className?: string;
}

/**
 * Presentational chip row with overflow handling: the first `max` items render
 * as chips; any remainder collapses into a "+K more" chip that opens a popover
 * listing every item with an individual remove control. Shared by
 * MultiCombobox and (later) the keyword tag input.
 */
export function OverflowChips({
  items,
  max = 3,
  onRemove,
  className,
}: OverflowChipsProps) {
  const visible = items.slice(0, max);
  const hidden = items.slice(max);

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((item) => (
        <Badge key={item.key} variant="secondary" className="gap-1">
          <span className="truncate">{item.label}</span>
          {onRemove && (
            <RemoveButton label={item.label} onRemove={() => onRemove(item.key)} />
          )}
        </Badge>
      ))}

      {hidden.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              +{hidden.length} more
            </Badge>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="hover:bg-muted flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-sm"
                >
                  <span className="truncate">{item.label}</span>
                  {onRemove && (
                    <RemoveButton
                      label={item.label}
                      onRemove={() => onRemove(item.key)}
                    />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function RemoveButton({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Remove ${label}`}
          className="hover:text-foreground text-muted-foreground -mr-1 inline-flex cursor-pointer items-center rounded-sm opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Remove</TooltipContent>
    </Tooltip>
  );
}
