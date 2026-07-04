import type { PaginationResult } from 'convex/server'

// Empty page returned by dashboard read queries when the caller isn't
// authenticated yet — e.g. the Convex client is mid Clerk-token refresh, or a
// query cached by ConvexQueryCacheProvider re-executes during that gap.
// Throwing there would surface an "Unauthorized" error even though the route
// is Clerk-protected; returning empty lets the reactive query repopulate the
// instant auth is back, and still leaks nothing to an unauthenticated caller.
export function emptyPage<T>(): PaginationResult<T> {
  return { page: [], isDone: true, continueCursor: '' }
}
