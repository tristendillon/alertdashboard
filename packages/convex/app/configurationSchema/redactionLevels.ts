import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";

export const { update: updateRedactionLevel, destroy: deleteRedactionLevel, create: createRedactionLevel, read: readRedactionLevel } = crud(
  schema,
  "redactionLevels",
  queryWithRLS,
  mutationWithRLS,
);