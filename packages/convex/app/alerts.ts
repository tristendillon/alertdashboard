import { crud } from "convex-helpers/server/crud";
import schema from "./schema";
import { queryWithRLS, mutationWithRLS } from "../middleware/rls";


export const { update: updateAlert, destroy: deleteAlert, create: createAlert, read: readAlert } = crud(
  schema,
  "alerts",
  queryWithRLS,
  mutationWithRLS,
);