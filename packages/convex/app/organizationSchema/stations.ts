import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";

export const { update: updateStation, destroy: deleteStation, create: createStation, read: readStation } = crud(
  schema,
  "stations",
  queryWithRLS,
  mutationWithRLS,
);