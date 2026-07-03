"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  DEFAULT_NUM_DISPATCHES,
  useDispatches,
} from "@/providers/dispatches-provider";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { timeStampFormatter } from "@/utils/timestamp";
import { CleanUnits } from "@/utils/units";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { cn } from "@/utils/ui";

const CleanType = (type: string) => {
  return type
    .replace(/[-_]/g, " ") // replace dashes and underscores with space
    .replace(/[^\w\s]/g, "") // remove all other special characters
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
};

interface DispatchListProps {
  onDispatchClick?: (dispatch: DispatchWithType) => void;
  className?: string;
  limit?: number;
}

export function DispatchList({
  onDispatchClick,
  className,
  limit,
}: DispatchListProps) {
  const { dispatches, loadMore, status } = useDispatches();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [loadCount, setLoadCount] = useState(0);

  // If limit is provided, slice the dispatches array
  const displayDispatches = limit ? dispatches.slice(0, limit) : dispatches;

  useEffect(() => {
    if (status !== "CanLoadMore" || limit) return; // Don't auto-load more if limit is set
    const loadMoreRefCurrent = loadMoreRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Calculate exponential loading size
          const base = DEFAULT_NUM_DISPATCHES;
          const multiplier = loadCount >= 10 ? 4 : loadCount >= 5 ? 2 : 1;
          const nextLoad = base * multiplier;

          loadMore(nextLoad);
          setLoadCount((count) => count + 1);
        }
      },
      { rootMargin: "200px" },
    );

    if (loadMoreRefCurrent) {
      observer.observe(loadMoreRefCurrent);
    }

    return () => {
      if (loadMoreRefCurrent) {
        observer.unobserve(loadMoreRefCurrent);
      }
    };
  }, [status, loadMore, loadCount, limit]);

  return (
    <div
      className={cn(
        "scroll-wrapper h-full space-y-2 overflow-y-auto p-4",
        className,
      )}
    >
      {status === "LoadingFirstPage" &&
        Array.from({ length: 6 }).map((_, i) => (
          <DispatchSkeletonCard key={i} />
        ))}

      {displayDispatches.map((dispatch) => (
        <DispatchCard
          key={dispatch.dispatchId}
          dispatch={dispatch}
          onDispatchClick={onDispatchClick}
        />
      ))}

      {status === "LoadingMore" &&
        Array.from({ length: 3 }).map((_, i) => (
          <DispatchSkeletonCard key={`loading-more-${i}`} />
        ))}

      {status === "CanLoadMore" && !limit && (
        <div ref={loadMoreRef} className="h-1" />
      )}
    </div>
  );
}

export function DispatchSkeletonCard() {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

interface DispatchCardProps {
  dispatch: DispatchWithType;
  onDispatchClick?: (dispatch: DispatchWithType) => void;
}

export function DispatchCard({ dispatch, onDispatchClick }: DispatchCardProps) {
  const formatRelative = timeStampFormatter("relative");
  const relativeCreatedAt = formatRelative(dispatch.dispatchCreatedAt);
  const [expanded, setExpanded] = useState(false);

  const UNITS_TO_SHOW_BASE = 4;
  const sortedUnits = dispatch.unitCodes.sort((a, b) => a.length - b.length);
  const cleanedUnits = CleanUnits(sortedUnits);
  const totalUnits = cleanedUnits.length;

  const unitsToShow =
    totalUnits == UNITS_TO_SHOW_BASE + 1
      ? UNITS_TO_SHOW_BASE - 1
      : UNITS_TO_SHOW_BASE;

  const visibleUnits = cleanedUnits.slice(0, unitsToShow);
  const hiddenUnits = cleanedUnits.slice(unitsToShow);

  return (
    <Card className="relative p-0">
      {onDispatchClick && (
        <a
          className="pointer-events-auto absolute inset-0 cursor-pointer"
          onClick={() => onDispatchClick(dispatch)}
        />
      )}
      <CardContent className="pointer-events-none relative z-10 p-3 px-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="font-semibold">{CleanType(dispatch.type)}</div>
          <div className="text-xs text-zinc-400 capitalize">
            {relativeCreatedAt}
          </div>
        </div>
        <pre
          className={`mb-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
        >
          {dispatch.narrative ?? "No details available"}
        </pre>
        <div className="flex items-center justify-between">
          <div>
            {dispatch.narrative && dispatch.narrative.length > 80 && (
              <button
                className="pointer-events-auto z-10 text-xs text-blue-400 hover:underline"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
            <div className="mb-2 text-xs text-zinc-500">
              {dispatch.address ?? "[REDACTED]"}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {totalUnits > unitsToShow ? (
              <>
                {visibleUnits.map((unit) => (
                  <Badge key={unit} variant="secondary">
                    {unit}
                  </Badge>
                ))}
                <Tooltip>
                  <TooltipTrigger className="pointer-events-auto">
                    <Badge>+{hiddenUnits.length} More</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hiddenUnits.map((unit, index) => (
                      <p key={index}>{unit}</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                {cleanedUnits.map((unit) => (
                  <Badge key={unit} variant="secondary">
                    {unit}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NarrativeProps {
  narrative: string;
}

export function Narrative({ narrative }: NarrativeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <pre
        className={`mb-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
      >
        {narrative ?? "No details available"}
      </pre>
      <div className="flex items-center justify-between">
        <div>
          {narrative && narrative.length > 80 && (
            <button
              className="pointer-events-auto z-10 text-xs text-blue-400 hover:underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
