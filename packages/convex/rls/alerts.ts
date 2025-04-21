import { QueryCtx } from "../app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "../app/_generated/dataModel.js";
import { withAuthContext } from "../context/auth-context.js";
import { hasPermission } from "../lib/permissions.js";

export const alertsRls: Rules<QueryCtx, DataModel>["alerts"] = {
  read: (ctx, alert) =>
    withAuthContext(ctx, alert, ({ authedUser }) => {
      return authedUser.organization === alert.organization;
    }),
  modify: (ctx, alert) =>
    withAuthContext(ctx, alert, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.organization === alert.organization });
    }),
  insert: (ctx, alert) =>
    withAuthContext(ctx, alert, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.organization === alert.organization });
    }),

}