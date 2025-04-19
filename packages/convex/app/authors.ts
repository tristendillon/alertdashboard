import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("authors")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("authors", {
      name: args.name,
      avatarUrl: args.avatarUrl,
    });
  },
});
