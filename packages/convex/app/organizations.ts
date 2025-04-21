import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import schema from "./schema";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const organizationExist = internalQuery({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.id);
    return !!organization;
  },
});

export const createOrganization = internalMutation({
  args: { name: v.string(), image: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const organization = await ctx.db.insert("organizations", {
      name: args.name,
      image: args.image,
    });
    return organization;
  },
})

export const { update: updateOrganization, read: readOrganization } = crud(
  schema,
  "organizations",
  queryWithRLS,
  mutationWithRLS,
);