import { env } from "@/env";
import { searchParamsCache } from "@/lib/validation";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { preloadQuery } from "convex/nextjs";
import { DispatchTypesTable } from "./_components/dispatch-types-table";

export default async function DispatchTypesPage({
  searchParams,
}: PageProps<"/dashboardv2/dispatch-types">) {
  const { page, perPage, sort } = await searchParamsCache.parse(searchParams);
  const preloaded = await preloadQuery(
    api.customization.paginatedDispatchTypes,
    {
      paginationOpts: {
        page,
        pageSize: perPage,
      },
      sort: {
        order: sort,
      },
      apiKey: env.CONVEX_API_KEY,
    },
  );

  return <DispatchTypesTable preloaded={preloaded} />;
}
