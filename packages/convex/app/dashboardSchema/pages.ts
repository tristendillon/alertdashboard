import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";

export const { update: updatePage, destroy: deletePage, create: createPage, read: readPage } = crud(
  schema,
  "pages",
  queryWithRLS,
  mutationWithRLS,
);