import { crud } from "convex-helpers/server/crud";
import { mutationWithRLS, queryWithRLS } from "../../middleware/rls.js";
import schema from "../schema.js";
import { v } from "convex/values";
import { mutationWithRLSAndUser } from "../../middleware/user.js";
import { permissionValidator } from "../../lib/permissions.js";
import { Scrypt } from "lucia";
import { internalQuery } from "../_generated/server.js";


export const readKey = internalQuery({
  args: {
    key: v.string(),
    organization: v.id("organizations"),
    department: v.union(v.literal("ALL"), v.id("departments")),
  },
  handler: async (ctx, { key, organization, department }) => {
    const apiKeys = await ctx.db.query("apiKeys")
      .withIndex("by_organization", (q) => q.eq("organization", organization))
      .collect();

    if (!apiKeys.length) {
      return false;
    }

    const departmentKeys = apiKeys.filter((apiKey) => {
      return apiKey.department === department;
    });

    if (!departmentKeys.length) {
      return null;
    }

    const apiKey = departmentKeys.find((apiKey) => {
      const crypt = new Scrypt();
      const isValid = crypt.verify(apiKey.hash, key);
      return isValid;
    });

    if (!apiKey) {
      return null;
    }

    return {
      _id: apiKey._id,
      organization: apiKey.organization,
      department: apiKey.department,
      keyPreview: apiKey.keyPreview,
      permissions: apiKey.permissions,
      modifiedAt: apiKey.modifiedAt,
      modifiedBy: apiKey.modifiedBy,
    }
  }
})

export const createKey = mutationWithRLSAndUser({
  args: {
    permissions: v.array(permissionValidator),
    department: v.union(v.literal("ALL"), v.id("departments")),
  },
  handler: async (ctx, { permissions, department }) => {
    const user = ctx.authedUser;
    const organization = user.organization;

    const rawKey = `ad_${Math.random().toString(36).substring(2, 15)}`;
    const crypt = new Scrypt();
    const hash = await crypt.hash(rawKey);

    const keyId = await ctx.db.insert("apiKeys", {
      organization,
      department,
      keyPreview: rawKey.slice(0, 5),
      hash,
      permissions,
      modifiedAt: Date.now(),
      modifiedBy: user._id,
    });

    return {
      _id: keyId,
      rawKey: rawKey,
    };
  },
});

export const readKeys = queryWithRLS({
  handler: async (ctx) => {
    const keys = await ctx.db.query("apiKeys").collect();
    return keys.map(key => ({
      _id: key._id,
      organization: key.organization,
      department: key.department,
      keyPreview: key.keyPreview,
      permissions: key.permissions,
      modifiedAt: key.modifiedAt,
      modifiedBy: key.modifiedBy,
    }));
  },
})

export const updateKey = mutationWithRLSAndUser({
  args: {
    id: v.id("apiKeys"),
    permissions: v.array(permissionValidator),
    department: v.union(v.literal("ALL"), v.id("departments")),
  },
  handler: async (ctx, { id, permissions, department }) => {
    const user = ctx.authedUser;

    await ctx.db.patch(id, {
      department,
      permissions,
      modifiedAt: Date.now(),
      modifiedBy: user._id,
    });
  },
})
export const { destroy: deleteKey } = crud(
  schema,
  "apiKeys",
  queryWithRLS,
  mutationWithRLS,
);
