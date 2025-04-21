import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { QueryCtx } from "../../app/_generated/server.js";
import { DataModel } from "../../app/_generated/dataModel.js";
import { withAuthContext } from "../../context/auth-context.js";
import { hasPermission } from "../../lib/permissions.js";


export const usersRls: Rules<QueryCtx, DataModel>["users"] = {
  read: (ctx, user) =>
    withAuthContext(ctx, user, ({ authedUser }) => {
      return authedUser.organization === user.organization;
    }),
  modify: (ctx, user) =>
    withAuthContext(ctx, user, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["user:modify"], compare: () => authedUser.organization === user.organization });
    }),
  insert: (ctx, user) =>
    withAuthContext(ctx, user, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["user:insert"], compare: () => authedUser.organization === user.organization });
    }),
}