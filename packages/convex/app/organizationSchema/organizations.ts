import { internalMutation, internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { mutationWithRLSAndUser, queryWithAuthedUser } from "@workspace/convex/middleware/user";
import { doc, partial } from "convex-helpers/validators";
import schema from "../schema";

export const readOrganization = queryWithAuthedUser({
  handler: async ({db, authedUser}) => {
    const organization = await db.get(authedUser.organization);
    return organization;
  },
})

export function betterOmit<T extends Record<string, any>, Keys extends (keyof T)[]>(
  obj: T,
  keys: Keys,
) {
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k as Keys[number])),
  );
  return v.object(filtered)
}
export const updateOrganization = mutationWithRLSAndUser({
  args: { patch: v.object({
    ...partial(doc(schema, "organizations").fields),
  }), },
  handler: async ({ db, authedUser }, { patch }) => {
    const organization = await db.get(authedUser.organization);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    // Optionally validate `authedUser.organization === organization._id`
    if (organization._id !== authedUser.organization) {
      throw new ConvexError("Unauthorized update");
    }

    const updatedOrganization = await db.patch(organization._id, patch);
    return updatedOrganization;
  },
});

export const organizationExist = internalQuery({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.id);
    return !!organization;
  },
})

export const createOrganization = internalMutation({
  args: { name: v.string(), image: v.optional(v.string()), city: v.string(), state: v.string() },
  handler: async (ctx, args) => {
    const organization = await ctx.db.insert("organizations", {
      name: args.name,
      image: args.image,
      city: args.city,
      state: args.state,
    });
    return organization;
  },
})
