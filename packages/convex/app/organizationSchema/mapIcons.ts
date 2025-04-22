import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { v } from "convex/values";

export const readDepartmentMapIcons = queryWithRLS({
  args: { department: v.id("departments") },
  handler: async (ctx, args) => {
    const mapIcons = await ctx.db.query("mapIcons")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();

    return mapIcons;
  },
});

export const readAllMapIcons = queryWithRLS({
  handler: async (ctx) => {
    const mapIcons = await ctx.db.query("mapIcons").collect();
    return mapIcons;
  },
});

export const { update: updateMapIcon, destroy: deleteMapIcon, create: createMapIcon, read: readMapIcon } = crud(
  schema,
  "mapIcons",
  queryWithRLS,
  mutationWithRLS,
);