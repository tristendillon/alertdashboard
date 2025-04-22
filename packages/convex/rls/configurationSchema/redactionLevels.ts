import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const redactionLevelsRls: Rules<QueryCtx, DataModel>["redactionLevels"] = {
  read: (ctx, redactionLevel) =>
    withAuthContext(ctx, redactionLevel, ({ authedUser }) => {
      return authedUser.organization === redactionLevel.organization;
    }),
  modify: (ctx, redactionLevel) =>
    withAuthContext(ctx, redactionLevel, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["redactionLevel:modify"], compare: () => authedUser.organization === redactionLevel.organization });
    }),
  insert: (ctx, redactionLevel) =>
    withAuthContext(ctx, redactionLevel, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["redactionLevel:insert"], compare: () => authedUser.organization === redactionLevel.organization });
    }),
}
