import { env } from "@/env";
import { searchParamsCache } from "@/lib/validation";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { preloadQuery } from "convex/nextjs";
import { FieldTransformationsTable } from "./_components/field-transformations-table";

export default async function FieldTransformationsPage({
  searchParams,
}: PageProps<"/dashboardv2/field-transformations">) {
  const { page, perPage, sort } = await searchParamsCache.parse(searchParams);
  const preloaded = await preloadQuery(
    api.transformations.paginatedFieldTransformations,
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

  return <FieldTransformationsTable preloaded={preloaded} />;
}
