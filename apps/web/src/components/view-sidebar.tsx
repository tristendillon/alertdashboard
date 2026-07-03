"use client";

import { Separator } from "@/components/ui/separator";
import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { DispatchList } from "@/components/dispatch-list";
import { CleanUnits } from "@/utils/units";
import { ApproximationWarning } from "@/components/ui/approximation-warning";
import { logger } from "@/utils/logger";

const CleanType = (type: string) => {
  return type
    .replace(/[-_]/g, " ") // replace dashes and underscores with space
    .replace(/[^\w\s]/g, "") // remove all other special characters
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
};

export function ViewSidebar() {
  const { dispatch, activateDispatch } = useActiveDispatch();
  return (
    <section className="bg-sidebar overflow-y-none relative flex h-full w-full flex-col">
      {dispatch ? (
        <AlertPopoverSidebarContent dispatch={dispatch} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <DispatchList onDispatchClick={activateDispatch} />
        </div>
      )}
    </section>
  );
}

interface AlertPopoverSidebarProps {
  dispatch: DispatchWithType;
}

function AlertPopoverSidebarContent({ dispatch }: AlertPopoverSidebarProps) {
  logger.debug(dispatch);
  return (
    <div className="bg-sidebar absolute inset-0 z-40 space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-destructive text-center text-3xl font-bold tracking-tighter uppercase md:text-6xl">
          {CleanType(dispatch.type)}
        </h2>
        <h3 className="text-center text-xl font-semibold md:text-3xl">
          {dispatch.address}
        </h3>
        <ApproximationWarning
          dispatchGroup={dispatch.group as string}
          variant="full"
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <h2 className="text-muted-foreground text-lg md:text-xl">
          Units Assigned:
        </h2>
        <div className="flex w-full flex-wrap gap-2">
          {CleanUnits(dispatch.unitCodes).map((unitCode, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary flex items-center rounded-md px-3 py-2"
            >
              {!dispatch.unitCodes.includes(unitCode) ? (
                <span className="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
              ) : (
                <span className="bg-muted mr-2 h-3 w-3 rounded-full"></span>
              )}
              <span className="text-base font-medium">{unitCode}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
