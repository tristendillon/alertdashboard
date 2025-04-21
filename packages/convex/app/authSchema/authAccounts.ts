import { crud } from "convex-helpers/server/crud";
import { internalMutationWithRLS, mutationWithRLS, queryWithRLS } from "../../middleware/rls.js";
import schema from "../schema.js";
import { v } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { Scrypt } from "lucia";

export const createAuthAccount = internalMutationWithRLS({
  args: {
    providerAccountId: v.string(),
    password: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, { providerAccountId, password, userId }) => {
    const hashed = await new Scrypt().hash(password)
    console.log("HASHED", hashed)
    const authAccount = await ctx.db.insert("authAccounts", {
      provider: "password",
      providerAccountId,
      secret: hashed,
      userId,
    });
    return authAccount;
  },
});


export const { update: updateAuthAccount, destroy: deleteAuthAccount } = crud(
  schema,
  "authAccounts",
  queryWithRLS,
  mutationWithRLS,
);
