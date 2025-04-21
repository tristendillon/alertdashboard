import { crud } from "convex-helpers/server/crud";
import schema from "./schema";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import { ConvexError, v } from "convex/values";
import { doc } from "convex-helpers/validators";
import { mutationWithApiKey } from "../middleware/apiKey";
import { internal } from "./_generated/api";
import { hasPermission } from "../lib/permissions";
import { omit } from "convex-helpers";

export const createAlertWithApiKey = mutationWithApiKey({
  args: {
    apiKey: v.string(),
    organization: v.id("organizations"),
    department: v.union(v.literal("ALL"), v.id("departments")),
    alert: v.object(omit(doc(schema, "alerts").fields, ["_id", "_creationTime"])),
  },
  handler: async (ctx, args) => {
    const { alert, apiKey, organization, department } = args;
    const key = await ctx.runQuery(internal.authSchema.apiKeys.readKey, { key: apiKey, organization: organization, department: department });
    if (!key) {
      throw new ConvexError("Invalid API key");
    }

    if (!hasPermission({perms: new Set(key.permissions), required: ["alert:insert"]})) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.insert("alerts", alert);
  },
});

export const { update: updateAlert, destroy: deleteAlert, create: createAlert, read: readAlert } = crud(
  schema,
  "alerts",
  queryWithRLS,
  mutationWithRLS,
);
