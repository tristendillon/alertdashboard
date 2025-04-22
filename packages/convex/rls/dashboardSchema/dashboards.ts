import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const dashboardsRls: Rules<QueryCtx, DataModel>["dashboards"] = {
  read: (ctx, dashboard) =>
    withAuthContext(ctx, dashboard, ({ authedUser }) => {
      return authedUser.departments.some(d => d._id === dashboard.department);
    }),
  modify: (ctx, dashboard) =>
    withAuthContext(ctx, dashboard, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["dashboard:modify"], compare: () => authedUser.departments.some(d => d._id === dashboard.department) });
    }),
  insert: (ctx, dashboard) =>
    withAuthContext(ctx, dashboard, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["dashboard:insert"], compare: () => authedUser.departments.some(d => d._id === dashboard.department) });
    }),
}
