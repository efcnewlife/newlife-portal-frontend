import type { Permission, Role } from "@/types/auth";
import { useCallback, useState } from "react";

interface PermissionData {
  permissions: Permission[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface UsePermissionDataReturn extends PermissionData {
  refreshPermissions: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  checkRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
}

export function usePermissionData(): UsePermissionDataReturn {
  const [data, setData] = useState<PermissionData>({
    permissions: [],
    roles: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Stubs: no API calls
  const refreshPermissions = useCallback(async () => {
    setData((prev) => ({ ...prev, lastUpdated: Date.now() }));
  }, []);

  const checkPermission = useCallback((_permission: string): boolean => {
    return false;
  }, []);

  const checkRole = useCallback((_role: string): boolean => {
    return false;
  }, []);

  const hasAnyPermission = useCallback((_permissions: string[]): boolean => {
    return false;
  }, []);

  const hasAllPermissions = useCallback((_permissions: string[]): boolean => {
    return false;
  }, []);

  const hasAnyRole = useCallback((_roles: string[]): boolean => {
    return false;
  }, []);

  const hasAllRoles = useCallback((_roles: string[]): boolean => {
    return false;
  }, []);

  return {
    ...data,
    refreshPermissions,
    checkPermission,
    checkRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
  };
}

export function usePermissionCheck() {
  const { checkPermission, checkRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles } = usePermissionData();

  return {
    checkPermission,
    checkRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
  };
}
