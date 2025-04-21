import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const unitsRls: Rules<QueryCtx, DataModel>["units"] = {
  read: (ctx, unit) =>
    withAuthContext(ctx, unit, ({ authedUser }) => {
      return authedUser.organization === unit.organization;
    }),
  modify: (ctx, unit) =>
    withAuthContext(ctx, unit, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.organization === unit.organization });
    }),
  insert: (ctx, unit) =>
    withAuthContext(ctx, unit, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.organization === unit.organization });
    }),
}
