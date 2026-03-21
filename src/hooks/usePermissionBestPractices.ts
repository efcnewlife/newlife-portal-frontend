// Best practices for permission checking Hook - Provides commonly used permission checking modes
import { useMemo } from "react";
import { usePermissions } from "../context/AuthContext";
import { usePermissionData } from "./usePermissionData";

export function usePermissionBestPractices() {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles } = usePermissions();
  const { permissions, roles } = usePermissionData();

  // Check if you are an administrator
  const isAdmin = useMemo(() => {
    return hasRole("admin") || hasPermission("system:admin");
  }, [hasRole, hasPermission]);

  // Check if it is a developer
  const isDeveloper = useMemo(() => {
    return hasRole("developer") || hasPermission("dev:debug");
  }, [hasRole, hasPermission]);

  // Check if you have user management rights
  const canManageUsers = useMemo(() => {
    return hasAnyPermission(["user:read", "user:write", "user:delete"]);
  }, [hasAnyPermission]);

  // Check if you have role management permissions
  const canManageRoles = useMemo(() => {
    return hasAnyPermission(["role:read", "role:write", "role:delete"]);
  }, [hasAnyPermission]);

  // Check if you have permission management permissions
  const canManagePermissions = useMemo(() => {
    return hasAnyPermission(["permission:read", "permission:write"]);
  }, [hasAnyPermission]);

  // Check if you have meeting management permissions
  const canManageConferences = useMemo(() => {
    return hasAnyPermission(["conference:read", "conference:write", "conference:delete"]);
  }, [hasAnyPermission]);

  // Check if there is API Key Administrative permissions
  const canManageApiKeys = useMemo(() => {
    return hasAnyPermission(["api-key:read", "api-key:write", "api-key:delete"]);
  }, [hasAnyPermission]);

  // Check if you have log viewing permissions
  const canViewLogs = useMemo(() => {
    return hasPermission("log:read");
  }, [hasPermission]);

  // Check if you have permission to view the dashboard
  const canViewDashboard = useMemo(() => {
    return hasPermission("dashboard:read");
  }, [hasPermission]);

  // Check if you have full administrative rights
  const hasFullAdminAccess = useMemo(() => {
    return isAdmin && canManageUsers && canManageRoles && canManagePermissions;
  }, [isAdmin, canManageUsers, canManageRoles, canManagePermissions]);

  // Check if you have system administrative rights
  const hasSystemAccess = useMemo(() => {
    return hasPermission("system:admin") || isDeveloper;
  }, [hasPermission, isDeveloper]);

  // Check if you have read permission (general)
  const hasReadAccess = useMemo(() => {
    return (resource: string) => hasPermission(`${resource}:read`);
  }, [hasPermission]);

  // Check if you have write permission (general)
  const hasWriteAccess = useMemo(() => {
    return (resource: string) => hasPermission(`${resource}:write`);
  }, [hasPermission]);

  // Check if you have delete permission (general)
  const hasDeleteAccess = useMemo(() => {
    return (resource: string) => hasPermission(`${resource}:delete`);
  }, [hasPermission]);

  // Check if there is complete CRUD Permissions (general)
  const hasFullAccess = useMemo(() => {
    return (resource: string) => {
      return hasAllPermissions([`${resource}:read`, `${resource}:write`, `${resource}:delete`]);
    };
  }, [hasAllPermissions]);

  // Get a list of all permissions for a user
  const getUserPermissions = useMemo(() => {
    return permissions.map((p) => `${p.resource}:${p.action}`);
  }, [permissions]);

  // Get a list of all roles for a user
  const getUserRoles = useMemo(() => {
    return roles.map((r) => r.name);
  }, [roles]);

  // Check if there are permissions for a specific resource
  const hasResourcePermission = useMemo(() => {
    return (resource: string, action: string) => {
      return hasPermission(`${resource}:${action}`);
    };
  }, [hasPermission]);

  // Check if there are multiple permissions for a specific resource
  const hasResourcePermissions = useMemo(() => {
    return (resource: string, actions: string[]) => {
      return hasAllPermissions(actions.map((action) => `${resource}:${action}`));
    };
  }, [hasAllPermissions]);

  // Check if you have any permissions on a specific resource
  const hasAnyResourcePermission = useMemo(() => {
    return (resource: string, actions: string[]) => {
      return hasAnyPermission(actions.map((action) => `${resource}:${action}`));
    };
  }, [hasAnyPermission]);

  // Permission check tool function
  const permissionUtils = {
    // Check if you are a super administrator
    isSuperAdmin: () => isAdmin && hasSystemAccess,

    // Check if you are a content manager
    isContentManager: () => canManageConferences && canViewDashboard,

    // Check if you are a system administrator
    isSystemManager: () => canManageUsers && canManageRoles && canManagePermissions,

    // Check if it is a general user
    isRegularUser: () => !isAdmin && !isDeveloper && canViewDashboard,

    // Check if you are a guest
    isGuest: () => !isAdmin && !isDeveloper && !canViewDashboard,

    // Check if you have administrative rights
    hasManagementAccess: () => canManageUsers || canManageRoles || canManagePermissions,

    // Check if there are system level permissions
    hasSystemLevelAccess: () => hasSystemAccess || isAdmin,

    // Check if there are app-level permissions
    hasApplicationLevelAccess: () => canManageConferences || canManageApiKeys,

    // Check if there are user level permissions
    hasUserLevelAccess: () => canViewDashboard || canViewLogs,
  };

  return {
    // Basic permission check
    isAdmin,
    isDeveloper,
    canManageUsers,
    canManageRoles,
    canManagePermissions,
    canManageConferences,
    canManageApiKeys,
    canViewLogs,
    canViewDashboard,
    hasFullAdminAccess,
    hasSystemAccess,

    // Universal permissions check
    hasReadAccess,
    hasWriteAccess,
    hasDeleteAccess,
    hasFullAccess,
    hasResourcePermission,
    hasResourcePermissions,
    hasAnyResourcePermission,

    // User profile
    getUserPermissions,
    getUserRoles,

    // Permission checking tool
    permissionUtils,

    // Original permission checking method
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
  };
}
// Advanced permission checking Hook
export function usePermissionGuard() {
  const permissionChecks = usePermissionBestPractices();

  // permission guard function
  const guard = {
    // Check and perform actions
    execute: (permission: string, action: () => void, fallback?: () => void) => {
      if (permissionChecks.hasPermission(permission)) {
        action();
      } else {
        fallback?.();
      }
    },

    // Check and return boolean value
    check: (permission: string): boolean => {
      return permissionChecks.hasPermission(permission);
    },

    // Checks and returns the Boolean value for conditional rendering
    render: (permission: string): boolean => {
      return permissionChecks.hasPermission(permission);
    },

    // Check multiple permissions (all match)
    checkAll: (permissions: string[]): boolean => {
      return permissionChecks.hasAllPermissions(permissions);
    },

    // Check multiple permissions (any one matches)
    checkAny: (permissions: string[]): boolean => {
      return permissionChecks.hasAnyPermission(permissions);
    },

    // Check role
    checkRole: (role: string): boolean => {
      return permissionChecks.hasRole(role);
    },

    // Check multiple roles (all match)
    checkAllRoles: (roles: string[]): boolean => {
      return permissionChecks.hasAllRoles(roles);
    },

    // Check multiple roles (any one matches)
    checkAnyRole: (roles: string[]): boolean => {
      return permissionChecks.hasAnyRole(roles);
    },
  };

  return {
    ...permissionChecks,
    guard,
  };
}
