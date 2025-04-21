import { withAuthContext } from "../context/auth-context.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { QueryCtx } from "../app/_generated/server.js";
import { DataModel } from "../app/_generated/dataModel.js";
import { hasPermission } from "../lib/permissions.js";

export const departmentsRls: Rules<QueryCtx, DataModel>["departments"] = {
  read: (ctx, dept) =>
    withAuthContext(ctx, dept, ({ authedUser }) => {
      return authedUser.organization === dept.organization;
    }),
  modify: (ctx, dept) =>
    withAuthContext(ctx, dept, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["department:modify"], compare: () => authedUser.organization === dept.organization });
    }),
  insert: (ctx, dept) =>
    withAuthContext(ctx, dept, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["department:insert"], compare: () => authedUser.organization === dept.organization });
    }),
}