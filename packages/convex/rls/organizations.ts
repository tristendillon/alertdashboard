import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "../app/_generated/dataModel.js";
import { withAuthContext } from "../context/auth-context.js";
import { hasPermission } from "../lib/permissions.js";
import { QueryCtx } from "../app/_generated/server.js";


export const organizationsRls: Rules<QueryCtx, DataModel>["organizations"] = {
  read: (ctx, org) =>
    withAuthContext(ctx, org, ({ authedUser }) => {
      return authedUser.organization === org._id;
    }),
  modify: (ctx, org) =>
    withAuthContext(ctx, org, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["organization:modify"], compare: () => authedUser.organization === org._id });
    }),
}