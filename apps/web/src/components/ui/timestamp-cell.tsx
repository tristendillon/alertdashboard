"use client";

import * as React from "react";
import { Cell, CellContent, type CellProps } from "./cell";
import { useFormatter, type DateTimeFormatVariant } from "@/utils/timestamp";
import { cn } from "@/utils/ui";

interface TimestampCellProps extends Omit<CellProps, "variant" | "asChild"> {
  timestamp: number;
  format?: DateTimeFormatVariant;
  locale?: string;
}

export function TimestampCell({
  timestamp,
  format = "short-12h",
  locale,
  className,
  ...props
}: TimestampCellProps) {
  const { format: formatTimestamp, isHydrated } = useFormatter(format);

  const formattedTime = React.useMemo(() => {
    return formatTimestamp(timestamp, locale);
  }, [formatTimestamp, timestamp, locale]);

  if (!isHydrated) {
    // Show skeleton during hydration
    return (
      <Cell variant="subtle" className={cn("animate-pulse", className)} {...props}>
        <CellContent>
          <div className="h-4 w-20 bg-muted rounded" />
        </CellContent>
      </Cell>
    );
  }

  return (
    <Cell 
      variant="subtle" 
      className={className}
      title={new Date(timestamp).toISOString()}
      {...props}
    >
      <CellContent>
        {formattedTime}
      </CellContent>
    </Cell>
  );
}