"use client";

import { useDashboard } from "@/providers/dashboard-provider";
import { DispatchCard, DispatchSkeletonCard } from "@/components/dispatch-list";

export function DispatchListContent() {
  const { loading, data } = useDashboard();

  if (loading) {
    return (
      <div className="max-h-80 gap-4 space-y-2 overflow-y-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <DispatchSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-h-80 gap-4 space-y-2 overflow-y-auto">
      {data.dispatches.map((dispatch) => (
        <DispatchCard key={dispatch.dispatchId} dispatch={dispatch} />
      ))}
    </div>
  );
}
