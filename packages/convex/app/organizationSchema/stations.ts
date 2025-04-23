import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { v } from "convex/values";

export const readStations = queryWithRLS({
  args: {
    department: v.id("departments"),
  },
  handler: async (ctx, args) => {

    const stations = await ctx.db.query("stations")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();

    return stations;
  },
})

export const { update: updateStation, destroy: deleteStation, create: createStation, read: readStation } = crud(
  schema,
  "stations",
  queryWithRLS,
  mutationWithRLS,
);