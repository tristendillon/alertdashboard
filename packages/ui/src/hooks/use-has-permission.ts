
import { Permission } from "@workspace/convex/lib/permissions"
import { useUser } from "../providers/user-provider";

interface UseHasPermission {
  hasPermission: boolean;
  hasPermissionLoading: boolean;
}

export function useHasPermission(permissions: Permission[]) {
  const user = useUser();

  if (!user) {
    return {
      hasPermission: false,
      hasPermissionLoading: true,
    };
  }

  if (user.joinedRole.permissions.includes("admin:all")) {
    return {
      hasPermission: true,
      hasPermissionLoading: false,
    };
  }

  return {
    hasPermission: permissions.every(permission => user.joinedRole.permissions.includes(permission)),
    hasPermissionLoading: false,
  };
}