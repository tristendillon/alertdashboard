import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const mapIconsRls: Rules<QueryCtx, DataModel>["mapIcons"] = {
  read: (ctx, mapIcon) =>
    withAuthContext(ctx, mapIcon, ({ authedUser }) => {
      return authedUser.organization === mapIcon.organization;
    }),
  modify: (ctx, mapIcon) =>
    withAuthContext(ctx, mapIcon, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["mapIcon:modify"], compare: () => authedUser.organization === mapIcon.organization });
    }),
  insert: (ctx, mapIcon) =>
    withAuthContext(ctx, mapIcon, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["mapIcon:insert"], compare: () => authedUser.organization === mapIcon.organization });
    }),
}