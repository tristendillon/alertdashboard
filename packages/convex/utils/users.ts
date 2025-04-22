import { Doc, Id } from "../app/_generated/dataModel.js";
import { QueryCtx } from "../app/_generated/server.js";
export async function getUserFromIdentityCtx(ctx: QueryCtx): Promise<Doc<'users'> & { departments: Doc<'departments'>[] } | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  let user: Doc<'users'> | null = null;

  const piped = identity.subject.split("|")

  if (piped.length > 1) {
    user = await ctx.db.get(piped[0] as Id<"users">);
  } else {
    user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.subject))
      .unique();
  }


  if (!user) {
    return null;
  }

  const departments = await ctx.db
    .query("departments")
    .withIndex("by_organization", (q) => q.eq("organization", user.organization))
    .collect();

  return { ...user, departments };
}
