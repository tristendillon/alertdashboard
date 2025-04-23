import { QueryCtx } from '@workspace/convex/app/_generated/server.js'
import { Rules } from 'convex-helpers/server/rowLevelSecurity'
import { DataModel } from '@workspace/convex/app/_generated/dataModel.js'
import { withAuthContext } from '@workspace/convex/context/auth-context.js'
import { hasPermission } from '@workspace/convex/lib/permissions.js'

export const mapDataTemplatesRls: Rules<
  QueryCtx,
  DataModel
>['mapDataTemplates'] = {
  read: (ctx, mapDataTemplate) =>
    withAuthContext(ctx, mapDataTemplate, ({ authedUser }) => {
      return authedUser.organization === mapDataTemplate.organization
    }),
  modify: (ctx, mapDataTemplate) =>
    withAuthContext(ctx, mapDataTemplate, ({ perms, authedUser }) => {
      return hasPermission({
        perms,
        required: ['mapDataTemplate:modify'],
        compare: () => authedUser.organization === mapDataTemplate.organization,
      })
    }),
  insert: (ctx, mapDataTemplate) =>
    withAuthContext(ctx, mapDataTemplate, ({ perms, authedUser }) => {
      return hasPermission({
        perms,
        required: ['mapDataTemplate:insert'],
        compare: () => authedUser.organization === mapDataTemplate.organization,
      })
    }),
}
