"use client";

import { useConvexAuth } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders dashboard content only once Convex has a validated Clerk token.
 *
 * Without this, a `useQuery`/`usePaginatedQuery` can fire on the initial mount
 * before Convex has the auth token, so `ctx.auth.getUserIdentity()` is
 * momentarily null and the `authedOrThrow*` wrappers throw "Unauthorized".
 * The route is already Clerk-protected by middleware, so this is a readiness
 * gate, not an access check.
 *
 * Uses `useConvexAuth` (single subtree) rather than the `<Authenticated>` /
 * `<AuthRefreshing>` components so content stays mounted through a mid-session
 * token refresh instead of unmounting and re-running every query.
 */
export function AuthedGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
