import { crud } from "convex-helpers/server/crud";
import schema from "./schema";
import { mutationWithRLS, queryWithRLS } from "../middleware/rls";
import { ConvexError, v } from "convex/values";
import { doc, partial } from "convex-helpers/validators";
import { mutationWithApiKey } from "../middleware/apiKey";
import { internal } from "./_generated/api";
import { hasPermission } from "../lib/permissions";
import { omit } from "convex-helpers";

// functions that use APIKeys are not used normally with instead they are called internally via http
// Thats why the returns look the way they do
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
      return {
        json: {
          "status": "Error",
          "message": "Invalid API key"
        },
        status: 401
      };
    }

    if (!hasPermission({perms: new Set(key.permissions), required: ["alert:insert"]})) {
      return {
        json: {
          "status": "Error",
          "message": "Api Key is not allowed to insert alerts"
        },
        status: 403
      };
    }

    const alertId = await ctx.db.insert("alerts", alert);
    return {
      json: {
        "status": "Created",
        "alert": alertId
      },
      status: 200
    };
  },
});

export const updateAlertWithApiKey = mutationWithApiKey({
  args: {
    apiKey: v.string(),
    organization: v.id("organizations"),
    department: v.union(v.literal("ALL"), v.id("departments")),
    alertId: v.id("alerts"),
    alert: v.object(partial(omit(doc(schema, "alerts").fields, ["_id", "_creationTime"]))),
  },
  handler: async (ctx, args) => {
    const { alert, apiKey, organization, department, alertId } = args;
    const key = await ctx.runQuery(internal.authSchema.apiKeys.readKey, { key: apiKey, organization: organization, department: department });
    if (!key) {
      return {
        json: {
          "status": "Error",
          "message": "Invalid API key"
        },
        status: 401
      };
    }

    if (!hasPermission({perms: new Set(key.permissions), required: ["alert:modify"]})) {
      return {
        json: {
          "status": "Error",
          "message": "Api key is not allowed to modify alerts"
        },
        status: 403
      };
    }

    const updatedId = await ctx.db.patch(alertId, alert);
    return {
      json: {
        "status": "Updated",
        "alert": updatedId
      },
      status: 200
    };
  },
});

export const { update: updateAlert, destroy: deleteAlert, create: createAlert, read: readAlert } = crud(
  schema,
  "alerts",
  queryWithRLS,
  mutationWithRLS,
);
