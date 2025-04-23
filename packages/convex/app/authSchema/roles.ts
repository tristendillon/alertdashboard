import { crud } from 'convex-helpers/server/crud'
import { mutationWithRLS, queryWithRLS } from '@workspace/convex/middleware/rls'
import schema from '../schema'
import { queryWithRLSAndUser } from '../../middleware/user'
import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'
import { permissionValidator } from '../../lib/permissions'

export const me = queryWithRLSAndUser({
  handler: async (ctx) => {
    if (!ctx.authedUser.role) return null
    const role = await ctx.db.get(ctx.authedUser.role)
    return role
  },
})

export const readRoles = queryWithRLS({
  handler: async (ctx) => {
    const roles = await ctx.db.query('roles').collect()
    return roles
  },
})

export const {
  update: updateRole,
  create: createRole,
  destroy: deleteRole,
  read: readRole,
} = crud(schema, 'roles', queryWithRLS, mutationWithRLS)
