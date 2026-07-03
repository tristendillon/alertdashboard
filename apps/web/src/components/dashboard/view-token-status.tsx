"use client";

import { useDashboard } from "@/providers/dashboard-provider";
import { timeStampFormatter } from "@/utils/timestamp";
import { Skeleton } from "@/components/ui/skeleton";

export function ViewTokenStatus() {
  const { loading, data } = useDashboard();
  const relativeFormatter = timeStampFormatter("relative");

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.viewTokens.map((token, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`size-2 rounded-full ${
                token.isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium">{token.name}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {relativeFormatter(token.lastPing)}
          </div>
        </div>
      ))}
    </div>
  );
}
