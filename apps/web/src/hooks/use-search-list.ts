"use client";

import {
  usePaginatedQuery,
  type PaginatedQueryArgs,
  type PaginatedQueryReference,
} from "convex/react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const INITIAL_NUM_ITEMS = 25;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Cursor-paginated list with a URL-backed (`?q=`), debounced search term.
 * Works with any of the `list*` Convex queries that take
 * `{ paginationOpts, search? }`; extra filter args (e.g. `group`) can be
 * passed through `extraArgs`. Changing the search or the extra args resets
 * the pagination automatically.
 */
export function useSearchList<Query extends PaginatedQueryReference>(
  query: Query,
  extraArgs?: Omit<PaginatedQueryArgs<Query>, "search">,
) {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  const { results, status, loadMore } = usePaginatedQuery(
    query,
    {
      ...(extraArgs ?? {}),
      search: debouncedSearch.trim() || undefined,
    } as unknown as PaginatedQueryArgs<Query>,
    { initialNumItems: INITIAL_NUM_ITEMS },
  );

  return { results, status, loadMore, search, setSearch };
}
