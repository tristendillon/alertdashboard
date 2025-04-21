import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";

export const { update: updateUnit, destroy: deleteUnit, create: createUnit, read: readUnit } = crud(
  schema,
  "units",
  queryWithRLS,
  mutationWithRLS,
);