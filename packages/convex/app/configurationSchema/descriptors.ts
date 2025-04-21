import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";

export const { update: updateDescriptor, destroy: deleteDescriptor, create: createDescriptor, read: readDescriptor } = crud(
  schema,
  "descriptors",
  queryWithRLS,
  mutationWithRLS,
);