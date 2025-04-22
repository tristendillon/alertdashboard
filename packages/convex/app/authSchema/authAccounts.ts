import schema from "../schema.js";
import { v } from "convex/values";
import { Scrypt } from "lucia";
import { doc, partial } from "convex-helpers/validators";
import { internalMutation } from "../_generated/server.js";

// This is pretty much entirely an internal table.
export const createAuthAccount = internalMutation({
  args: {
    providerAccountId: v.string(),
    password: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, { providerAccountId, password, userId }) => {
    const hashed = await new Scrypt().hash(password)
    const authAccount = await ctx.db.insert("authAccounts", {
      provider: "password",
      providerAccountId,
      secret: hashed,
      userId,
    });
    return authAccount;
  },
});

export const deleteAuthAccount = internalMutation({
  args: {
    id: v.id("authAccounts")
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});


export const updateAuthAccount = internalMutation({
  args: { patch: v.object({
    ...partial(doc(schema, "authAccounts").fields),
    _id: v.id("authAccounts"),
  }), },
  handler: async ({ db }, { patch }) => {
    const updatedUser = await db.patch(patch._id, patch);
    return updatedUser;
  },
});
