import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const pagesRls: Rules<QueryCtx, DataModel>["pages"] = {
  read: (ctx, page) =>
    withAuthContext(ctx, page, ({ authedUser }) => {
      return authedUser.departments.some(d => d._id === page.department);
    }),
  modify: (ctx, page) =>
    withAuthContext(ctx, page, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.departments.some(d => d._id === page.department) });
    }),
  insert: (ctx, page) =>
    withAuthContext(ctx, page, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["admin:all"], compare: () => authedUser.departments.some(d => d._id === page.department) });
    }),
}
