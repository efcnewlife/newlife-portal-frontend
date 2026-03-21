import { useMemo } from "react";
import { usePermissions } from "../context/AuthContext";

export interface ResourcePermissions {
  canCreate: boolean;
  canRead: boolean;
  canModify: boolean;
  canDelete: boolean;
}

export const useResourcePermissions = (): ResourcePermissions => {
  const { hasPermission } = usePermissions();

  const permissions = useMemo(
    () => ({
      canCreate: hasPermission("system:resource:create"),
      canRead: hasPermission("system:resource:read"),
      canModify: hasPermission("system:resource:modify"),
      canDelete: hasPermission("system:resource:delete"),
    }),
    [hasPermission]
  );

  return permissions;
};
