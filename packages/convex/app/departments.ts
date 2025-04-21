import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import schema from "./schema";

export const readDepartments = queryWithRLS({
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").collect();
    return departments;
  },
});

export const { update: updateDepartment, destroy: deleteDepartment, create: createDepartment, read: readDepartment } = crud(
  schema,
  "departments",
  queryWithRLS,
  mutationWithRLS,
);