"use client";

import { useQuery } from "./use-query";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";

export function useDispatchAnalytics() {
  const { data: recentDispatches, isPending: isPendingRecentDispatches } =
    useQuery(api.dispatches.getRecentDispatches, {
      limit: 5,
    });
  const { data: dispatchStats, isPending: isPendingDispatchStats } = useQuery(
    api.dispatches.getDispatchStats,
    {},
  );

  return {
    loading:
      isPendingRecentDispatches ||
      isPendingDispatchStats ||
      recentDispatches === undefined ||
      dispatchStats === undefined,
    dispatches: recentDispatches,
    totalDispatches: dispatchStats?.total,
    counts: dispatchStats?.counts,
    todaysDispatches: dispatchStats?.todaysDispatches,
    hours: dispatchStats?.hours,
  };
}
