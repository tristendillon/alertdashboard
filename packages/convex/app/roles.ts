import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import schema from "./schema";

export const readRoles = queryWithRLS({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles;
  },
});

export const { update: updateRole, create: createRole, destroy: deleteRole, read: readRole } = crud(
  schema,
  "roles",
  queryWithRLS,
  mutationWithRLS,
);