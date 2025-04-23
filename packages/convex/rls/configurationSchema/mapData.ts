import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const mapDataRls: Rules<QueryCtx, DataModel>["mapData"] = {
  read: (ctx, mapData) =>
    withAuthContext(ctx, mapData, ({ authedUser }) => {
      return authedUser.organization === mapData.organization;
    }),
  modify: (ctx, mapData) =>
    withAuthContext(ctx, mapData, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["mapData:modify"], compare: () => authedUser.organization === mapData.organization });
    }),
  insert: (ctx, mapData) =>
    withAuthContext(ctx, mapData, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["mapData:insert"], compare: () => authedUser.organization === mapData.organization });
    }),
}