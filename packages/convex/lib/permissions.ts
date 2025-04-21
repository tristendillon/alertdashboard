import { v, Infer } from "convex/values";
import { QueryCtx } from "../app/_generated/server.js";
import { Doc } from "../app/_generated/dataModel.js";

export async function getUserPermissions(user: Doc<'users'>, ctx: QueryCtx): Promise<Set<Permission>> {
  const role = user.role
    ? await ctx.db.get(user.role)
    : null;

  const rolePermissions = role?.permissions ?? [];
  const userPermissions = user.userPermissions ?? [];
  return new Set([...rolePermissions, ...userPermissions]);
}

export function hasPermission({
  perms,
  compare,
  required
}: {
  perms: Set<Permission>
  compare?: () => boolean;
  required: Permission[]
}): boolean {
  const hasPerm =
    perms.has("admin:all") ||
    required.some((perm) => perms.has(perm));

  return hasPerm && (compare ? compare() : true);
}



export const permissionValidator = v.union(
  v.literal("dashboard:insert"),
  v.literal("dashboard:modify"),
  v.literal("dashboard:delete"),

  v.literal("alert:insert"),
  v.literal("alert:modify"),
  v.literal("alert:delete"),

  v.literal("organization:modify"),
  v.literal("organization:delete"),

  v.literal("department:insert"),
  v.literal("department:modify"),
  v.literal("department:delete"),

  v.literal("user:insert"),
  v.literal("user:modify"),
  v.literal("user:delete"),

  v.literal("roles:insert"),
  v.literal("roles:modify"),
  v.literal("roles:delete"),

  v.literal("admin:all")
);

export type Permission = Infer<typeof permissionValidator>;
