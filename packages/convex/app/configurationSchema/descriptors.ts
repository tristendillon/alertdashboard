import { crud } from "convex-helpers/server/crud";
import { queryWithRLS, mutationWithRLS } from "@workspace/convex/middleware/rls";
import schema from "../schema";
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const mappableDescriptors = internalQuery({
  args: { department: v.id("departments") },
  handler: async (ctx, args) => {
    const descriptors = await ctx.db.query("descriptors")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();
    return descriptors;
  },
})

export const { update: updateDescriptor, destroy: deleteDescriptor, create: createDescriptor, read: readDescriptor } = crud(
  schema,
  "descriptors",
  queryWithRLS,
  mutationWithRLS,
);