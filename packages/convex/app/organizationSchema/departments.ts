import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const departmentExist = internalQuery({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.id);
    return !!department;
  },
})


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