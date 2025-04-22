import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";

export const descriptorsRls: Rules<QueryCtx, DataModel>["descriptors"] = {
  read: (ctx, descriptor) =>
    withAuthContext(ctx, descriptor, ({ authedUser }) => {
      return authedUser.organization === descriptor.organization;
    }),
  modify: (ctx, descriptor) =>
    withAuthContext(ctx, descriptor, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["descriptor:modify"], compare: () => authedUser.organization === descriptor.organization });
    }),
  insert: (ctx, descriptor) =>
    withAuthContext(ctx, descriptor, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["descriptor:insert"], compare: () => authedUser.organization === descriptor.organization });
    }),
}
