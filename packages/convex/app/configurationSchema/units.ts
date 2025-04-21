import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const mappableUnits = internalQuery({
  args: { department: v.id("departments") },
  handler: async (ctx, args) => {
    const units = await ctx.db.query("units")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();
    return units;
  },
})

export const { update: updateUnit, destroy: deleteUnit, create: createUnit, read: readUnit } = crud(
  schema,
  "units",
  queryWithRLS,
  mutationWithRLS,
);