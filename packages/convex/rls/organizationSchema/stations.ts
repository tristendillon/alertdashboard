import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const stationsRls: Rules<QueryCtx, DataModel>["stations"] = {
  read: (ctx, station) =>
    withAuthContext(ctx, station, ({ authedUser }) => {
      return authedUser.departments.some(d => d._id === station.department)
    }),
  modify: (ctx, station) =>
    withAuthContext(ctx, station, ({ perms, authedUser }) =>{
      return hasPermission({perms, required: ["station:modify"], compare: () => authedUser.departments.some(d => d._id === station.department),})
    }),
  insert: (ctx, station) =>
    withAuthContext(ctx, station, ({ perms, authedUser }) => {
      return hasPermission({perms, required: ["station:insert"], compare: () => authedUser.departments.some(d => d._id === station.department),})
    }),
};