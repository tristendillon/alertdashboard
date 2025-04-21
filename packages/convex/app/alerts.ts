import { crud } from "convex-helpers/server/crud";
import schema from "./schema";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";

export const { update: updateAlert, destroy: deleteAlert, create: createAlert, read: readAlert } = crud(
  schema,
  "alerts",
  queryWithRLS,
  mutationWithRLS,
);