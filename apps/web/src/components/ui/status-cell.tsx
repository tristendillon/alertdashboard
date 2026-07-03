import * as React from "react";
import { Badge } from "./badge";
import { Cell, CellPrefix, CellContent, type CellProps } from "./cell";
import { cn } from "@/utils/ui";
import type { DispatchGroupEnum } from "@sizeupdashboard/convex/src/api/schema.js";

interface StatusCellProps extends Omit<CellProps, "variant" | "asChild"> {
  status: string;
  description?: string;
  variant?: "dispatch" | "hydrant" | "custom";
  statusType?: DispatchGroupEnum | string;
}

const getDispatchVariant = (group: DispatchGroupEnum | string) => {
  switch (group) {
    case "fire":
      return "destructive" as const;
    case "medical":
      return "default" as const;
    case "law":
      return "outline" as const;
    case "rescue":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const getHydrantVariant = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("active") || lowerStatus.includes("good")) {
    return "default" as const;
  }
  if (lowerStatus.includes("out") || lowerStatus.includes("broken")) {
    return "destructive" as const;
  }
  return "secondary" as const;
};

export function StatusCell({
  status,
  description,
  variant = "custom",
  statusType,
  className,
  ...props
}: StatusCellProps) {
  const badgeVariant = React.useMemo(() => {
    if (variant === "dispatch" && statusType) {
      return getDispatchVariant(statusType);
    }
    if (variant === "hydrant") {
      return getHydrantVariant(status);
    }
    return "outline" as const;
  }, [variant, status, statusType]);

  return (
    <Cell className={cn("gap-3", className)} {...props}>
      <CellPrefix>
        <Badge variant={badgeVariant} className="text-xs">
          {status}
        </Badge>
      </CellPrefix>
      {description && (
        <CellContent truncate>
          {description}
        </CellContent>
      )}
    </Cell>
  );
}