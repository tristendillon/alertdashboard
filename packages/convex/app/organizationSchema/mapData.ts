import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { v } from "convex/values";

export const readDepartmentMapData = queryWithRLS({
  args: { department: v.id("departments") },
  handler: async (ctx, args) => {
    const mapData = await ctx.db.query("mapData")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();

    return mapData;
  },
});

export const readAllMapData = queryWithRLS({
  handler: async (ctx) => {
    const mapData = await ctx.db.query("mapData").collect();
    return mapData;
  },
});

export const { update: updateMapData, destroy: deleteMapData, create: createMapData, read: readMapData } = crud(
  schema,
  "mapData",
  queryWithRLS,
  mutationWithRLS,
);