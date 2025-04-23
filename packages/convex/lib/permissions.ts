import { v, Infer } from 'convex/values'
import { QueryCtx } from '../app/_generated/server.js'
import { Doc } from '../app/_generated/dataModel.js'

export async function getUserPermissions(
  user: Doc<'users'>,
  ctx: QueryCtx
): Promise<Set<Permission>> {
  const role = user.role ? await ctx.db.get(user.role) : null

  const rolePermissions = role?.permissions ?? []
  const userPermissions = user.userPermissions ?? []
  return new Set([...rolePermissions, ...userPermissions])
}

export function hasPermission({
  perms,
  compare,
  required,
}: {
  perms: Set<Permission>
  compare?: () => boolean
  required: Permission[]
}): boolean {
  const hasPerm =
    perms.has('admin:all') || required.some((perm) => perms.has(perm))

  return hasPerm && (compare ? compare() : true)
}

export const permissionValidator = v.union(
  // Dashboard permissions
  v.literal('dashboard:insert'),
  v.literal('dashboard:modify'),

  // Alert permissions
  v.literal('alert:insert'),
  v.literal('alert:modify'),

  // Organization permissions
  v.literal('organization:insert'),
  v.literal('organization:modify'),

  // Department permissions
  v.literal('department:insert'),
  v.literal('department:modify'),

  // Station permissions
  v.literal('station:insert'),
  v.literal('station:modify'),

  // MapIcon permissions
  v.literal('mapIcon:insert'),
  v.literal('mapIcon:modify'),

  // MapData permissions
  v.literal('mapData:insert'),
  v.literal('mapData:modify'),

  // MapDataTemplate permissions
  v.literal('mapDataTemplate:insert'),
  v.literal('mapDataTemplate:modify'),

  // Unit permissions
  v.literal('unit:insert'),
  v.literal('unit:modify'),

  // Descriptor permissions
  v.literal('descriptor:insert'),
  v.literal('descriptor:modify'),

  // RedactionLevel permissions
  v.literal('redactionLevel:insert'),
  v.literal('redactionLevel:modify'),

  // User permissions
  v.literal('user:insert'),
  v.literal('user:modify'),

  // Role permissions
  v.literal('roles:insert'),
  v.literal('roles:modify'),

  // Page permissions
  v.literal('page:insert'),
  v.literal('page:modify'),

  // Api Keys permissions
  v.literal('apiKey:read'),
  v.literal('apiKey:insert'),
  v.literal('apiKey:modify'), // This is for updating or deleting

  // Global admin permission
  v.literal('admin:all')
)

export type Permission = Infer<typeof permissionValidator>
