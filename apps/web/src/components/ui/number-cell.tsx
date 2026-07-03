import * as React from "react";
import { Cell, CellContent, type CellProps } from "./cell";
import { cn } from "@/utils/ui";

interface NumberCellProps extends Omit<CellProps, "variant" | "asChild"> {
  value: number | null | undefined;
  unit?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  emptyText?: string;
  formatStyle?: "decimal" | "currency" | "percent";
  locale?: string;
}

export function NumberCell({
  value,
  unit,
  decimals = 0,
  prefix,
  suffix,
  emptyText = "—",
  formatStyle = "decimal",
  locale = "en-US",
  className,
  ...props
}: NumberCellProps) {
  const formattedValue = React.useMemo(() => {
    if (value == null) return emptyText;

    const formatter = new Intl.NumberFormat(locale, {
      style: formatStyle,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    let formatted = formatter.format(value);
    
    if (prefix) formatted = `${prefix}${formatted}`;
    if (suffix) formatted = `${formatted}${suffix}`;
    if (unit) formatted = `${formatted} ${unit}`;

    return formatted;
  }, [value, unit, decimals, prefix, suffix, emptyText, formatStyle, locale]);

  return (
    <Cell 
      variant="subtle"
      className={cn("font-mono text-right", className)}
      title={value != null ? value.toString() : undefined}
      {...props}
    >
      <CellContent className="text-right">
        {formattedValue}
      </CellContent>
    </Cell>
  );
}