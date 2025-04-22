import { QueryCtx } from "@workspace/convex/app/_generated/server.js";
import { Rules } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "@workspace/convex/app/_generated/dataModel.js";
import { withAuthContext } from "@workspace/convex/context/auth-context.js";
import { hasPermission } from "@workspace/convex/lib/permissions.js";


export const apiKeysRls: Rules<QueryCtx, DataModel>["apiKeys"] = {
  read: (ctx, apiKey) =>
    withAuthContext(ctx, apiKey, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["apiKey:read"], compare: () => authedUser.organization === apiKey.organization });
    }),
  modify: (ctx, apiKey) =>
    withAuthContext(ctx, apiKey, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["apiKey:modify"], compare: () => authedUser.organization === apiKey.organization });
    }),
  insert: (ctx, apiKey) =>
    withAuthContext(ctx, apiKey, ({ perms, authedUser }) => {
      return hasPermission({ perms, required: ["apiKey:insert"], compare: () => authedUser.organization === apiKey.organization })
    }),
};