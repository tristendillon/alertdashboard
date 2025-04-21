import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { QueryCtx } from "../app/_generated/server.js";
import { DataModel } from "../app/_generated/dataModel.js";
import { withAuthContext } from "../context/auth-context.js";
import { hasPermission } from "../lib/permissions.js";

export const stationsRls: Rules<QueryCtx, DataModel>["stations"] = {
  read: (ctx, station) =>
    withAuthContext(ctx, station, ({ authedUser }) =>
      authedUser.departments.some(d => d._id === station.department)
    ),
  modify: (ctx, station) =>
    withAuthContext(ctx, station, ({ perms, authedUser }) =>
      hasPermission({
        perms,
        required: ["admin:all"],
        compare: () => authedUser.departments.some(d => d._id === station.department),
      })
    ),
  insert: (ctx, station) =>
    withAuthContext(ctx, station, ({ perms, authedUser }) =>
      hasPermission({
        perms,
        required: ["admin:all"],
        compare: () => authedUser.departments.some(d => d._id === station.department),
      })
    ),
};