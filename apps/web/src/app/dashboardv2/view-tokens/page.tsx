import { env } from "@/env";
import { searchParamsCache } from "@/lib/validation";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { preloadQuery } from "convex/nextjs";
import { ViewTokensTable } from "./_components/view-tokens-table";

export default async function ViewTokensPage({
  searchParams,
}: PageProps<"/dashboardv2/view-tokens">) {
  const { page, perPage, sort } = await searchParamsCache.parse(searchParams);
  const preloaded = await preloadQuery(api.viewToken.paginatedViewTokens, {
    paginationOpts: {
      page,
      pageSize: perPage,
    },
    sort: {
      order: sort,
    },
    apiKey: env.CONVEX_API_KEY,
  });

  return <ViewTokensTable preloaded={preloaded} />;
}
