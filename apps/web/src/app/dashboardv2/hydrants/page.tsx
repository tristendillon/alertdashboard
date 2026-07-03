import { env } from "@/env";
import { searchParamsCache } from "@/lib/validation";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { preloadQuery } from "convex/nextjs";
import { HydrantsTable } from "./_components/hydrants-table";

export default async function HydrantsPage({
  searchParams,
}: PageProps<"/dashboardv2/hydrants">) {
  const { page, perPage, sort } = await searchParamsCache.parse(searchParams);
  const preloaded = await preloadQuery(api.hydrants.paginatedHydrants, {
    paginationOpts: {
      page,
      pageSize: perPage,
    },
    sort: {
      order: sort,
    },
    apiKey: env.CONVEX_API_KEY,
  });

  return <HydrantsTable preloaded={preloaded} />;
}
