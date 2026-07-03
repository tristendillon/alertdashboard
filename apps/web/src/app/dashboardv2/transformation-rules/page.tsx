import { env } from "@/env";
import { searchParamsCache } from "@/lib/validation";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { preloadQuery } from "convex/nextjs";
import { TransformationRulesTable } from "./_components/transformation-rules-table";

export default async function TransformationRulesPage({
  searchParams,
}: PageProps<"/dashboardv2/transformation-rules">) {
  const { page, perPage, sort } = await searchParamsCache.parse(searchParams);
  const preloaded = await preloadQuery(
    api.transformations.paginatedTransformationRules,
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

  return <TransformationRulesTable preloaded={preloaded} />;
}
