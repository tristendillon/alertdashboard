import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const rolesRls: Rules<QueryCtx, DataModel>["roles"] = {
  read: (ctx, role) =>
    withAuthContext(ctx, role, ({ authedUser }) => {
      return authedUser.organization === role.organization;
    }),
  modify: (ctx, role) =>
    withAuthContext(ctx, role, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["roles:modify"], compare: () => authedUser.organization === role.organization });
    }),
  insert: (ctx, role) =>
    withAuthContext(ctx, role, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["roles:insert"], compare: () => authedUser.organization === role.organization })
    }),
};