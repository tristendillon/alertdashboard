import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";


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