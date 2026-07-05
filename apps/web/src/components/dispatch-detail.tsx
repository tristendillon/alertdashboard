"use client";

import { Separator } from "@/components/ui/separator";
import { ApproximationWarning } from "@/components/ui/approximation-warning";
import { CleanUnits } from "@/utils/units";
import { cn } from "@/utils/ui";
import type {
  DispatchWithType,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";

const CleanType = (type: string) => {
  return type
    .replace(/[-_]/g, " ") // replace dashes and underscores with space
    .replace(/[^\w\s]/g, "") // remove all other special characters
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
};

interface DispatchDetailProps {
  dispatch: DispatchWithType | TransformedDispatch;
  compact?: boolean;
}

/**
 * The dispatch detail body (type heading, address, approximation warning and
 * assigned units). The absolute-positioned public view keeps its wrapper in
 * ViewSidebar; `compact` shrinks the headings for inline/preview use. Tolerates
 * `address` and `unitCodes` being removed by a transformation.
 */
export function DispatchDetail({ dispatch, compact = false }: DispatchDetailProps) {
  const units = CleanUnits(dispatch.unitCodes ?? []);

  return (
    <>
      <div className="space-y-2">
        <h2
          className={cn(
            "text-destructive text-center font-bold tracking-tighter uppercase",
            compact ? "text-2xl" : "text-3xl md:text-6xl",
          )}
        >
          {CleanType(dispatch.type)}
        </h2>
        <h3
          className={cn(
            "text-center font-semibold",
            compact ? "text-lg" : "text-xl md:text-3xl",
          )}
        >
          {dispatch.address ?? "—"}
        </h3>
        <ApproximationWarning
          dispatchGroup={dispatch.group as string}
          variant={compact ? "compact" : "full"}
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <h2
          className={cn(
            "text-muted-foreground",
            compact ? "text-sm" : "text-lg md:text-xl",
          )}
        >
          Units Assigned:
        </h2>
        <div className="flex w-full flex-wrap gap-2">
          {units.map((unitCode, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary flex items-center rounded-md px-3 py-2"
            >
              {!(dispatch.unitCodes ?? []).includes(unitCode) ? (
                <span className="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
              ) : (
                <span className="bg-muted mr-2 h-3 w-3 rounded-full"></span>
              )}
              <span className="text-base font-medium">{unitCode}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
