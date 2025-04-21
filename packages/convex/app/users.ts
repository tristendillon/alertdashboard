import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import schema from "./schema";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { mutationWithAuthedUser } from "../middleware/user";
import { partial } from "convex-helpers/validators";
import { doc } from "convex-helpers/validators";

export const emailTaken = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db.query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    return !!user;
  },
});

export const updateMe = mutationWithAuthedUser({
  args: { patch: v.object({
    ...partial(doc(schema, "users").fields),
  }), },
  handler: async ({ db, authedUser }, { patch }) => {
    const updatedUser = await db.patch(authedUser._id, patch);
    return updatedUser;
  },
});

export const { update: updateUser, create: createUser, destroy: deleteUser, read: readUser } = crud(
  schema,
  "users",
  queryWithRLS,
  mutationWithRLS,
);
