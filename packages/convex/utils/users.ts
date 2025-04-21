import { Doc } from "../app/_generated/dataModel.js";
import { QueryCtx } from "../app/_generated/server.js";
export async function getUserFromIdentityCtx(ctx: QueryCtx): Promise<Doc<'users'> & { departments: Doc<'departments'>[] } | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", identity.subject))
    .unique();
  if (!user) {
    return null;
  }

  const departments = await ctx.db
    .query("departments")
    .withIndex("by_organization", (q) => q.eq("organization", user.organization))
    .collect();

  return { ...user, departments };
}