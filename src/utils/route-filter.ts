import { IS_DEV } from "@/config/env";
import type { Permission, Role, User } from "../types/auth";
import type { AppRoute } from "../types/route";

// Route filtering options
interface RouteFilterOptions {
  isAuthenticated: boolean;
  user: User | null;
  permissions: Permission[];
  roles: Role[];
}

// Check if the route is accessible
function canAccessRoute(route: AppRoute, options: RouteFilterOptions): boolean {
  const { isAuthenticated, user, permissions, roles } = options;
  const { meta } = route;

  // Non-development environment filtering devOnly routing
  if (meta?.devOnly && !IS_DEV) {
    return false;
  }

  // If the route clearly indicates that authentication is not required, access is allowed
  if (meta?.requiresAuth === false) {
    return true;
  }

  // If the route requires authentication but the user is not logged in, access is denied
  const routeRequiresAuth = meta?.requiresAuth === true || meta?.requiresAuth === undefined;
  if (routeRequiresAuth && !isAuthenticated) {
    return false;
  }

  // If the user is logged in, check roles and permissions
  if (isAuthenticated) {
    // Prioritize access rights data for checking
    if (permissions.length > 0 || roles.length > 0) {
      // Check role permissions
      if (meta?.roles && meta.roles.length > 0) {
        const hasRequiredRole = meta.roles.some((role) => roles.some((r) => r.name === role));
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Check permissions (if the route is defined permissions）
      if (meta?.permissions && meta.permissions.length > 0) {
        const hasRequiredPermission = meta.permissions.some((permission) =>
          permissions.some((p) => p.resource + ":" + p.action === permission)
        );
        if (!hasRequiredPermission) {
          return false;
        }
      }
    } else if (user) {
      // Go back to user profile to check
      // Check role permissions
      if (meta?.roles && meta.roles.length > 0) {
        const hasRequiredRole = meta.roles.some((role) => user.roles.includes(role));
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Check permissions (if the route is defined permissions）
      if (meta?.permissions && meta.permissions.length > 0) {
        const hasRequiredPermission = meta.permissions.some((permission) => user.permissions.includes(permission));
        if (!hasRequiredPermission) {
          return false;
        }
      }
    }
  }

  return true;
}

// Recursive filter routing
function filterRoutesRecursive(routes: AppRoute[], options: RouteFilterOptions): AppRoute[] {
  return routes
    .map((route) => {
      // Check if the current route is accessible
      if (!canAccessRoute(route, options)) {
        return null;
      }

      // If there are sub-routes, recursive filtering
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterRoutesRecursive(route.children, options);

        // If all sub-routes are filtered out and the current route does not element，then also filter out
        if (filteredChildren.length === 0 && !route.element) {
          return null;
        }

        return {
          ...route,
          children: filteredChildren,
        };
      }

      return route;
    })
    .filter((route): route is AppRoute => route !== null);
}

// Main routing filtering functions
export function filterRoutesByAuth(
  routes: AppRoute[],
  isAuthenticated: boolean,
  user: User | null,
  permissions: Permission[] = [],
  roles: Role[] = []
): AppRoute[] {
  const options: RouteFilterOptions = {
    isAuthenticated,
    user,
    permissions,
    roles,
  };

  return filterRoutesRecursive(routes, options);
}

// Get public routes (routes that do not require authentication)
export function getPublicRoutes(routes: AppRoute[]): AppRoute[] {
  return routes.filter((route) => route.meta?.requiresAuth === false);
}

// Get routes that require authentication
export function getAuthRequiredRoutes(routes: AppRoute[]): AppRoute[] {
  return routes.filter((route) => route.meta?.requiresAuth !== false);
}

// Check if the path is accessible
export function isPathAccessible(
  path: string,
  routes: AppRoute[],
  isAuthenticated: boolean,
  user: User | null,
  permissions: Permission[] = [],
  roles: Role[] = []
): boolean {
  const findRouteByPath = (routeList: AppRoute[], targetPath: string): AppRoute | null => {
    for (const route of routeList) {
      if (route.path === targetPath) {
        return route;
      }
      if (route.children) {
        const found = findRouteByPath(route.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const route = findRouteByPath(routes, path);
  if (!route) return false;

  return canAccessRoute(route, { isAuthenticated, user, permissions, roles });
}

// Get all paths accessible to the user
export function getAccessiblePaths(
  routes: AppRoute[],
  isAuthenticated: boolean,
  user: User | null,
  permissions: Permission[] = [],
  roles: Role[] = []
): string[] {
  const paths: string[] = [];

  const collectPaths = (routeList: AppRoute[]) => {
    routeList.forEach((route) => {
      if (canAccessRoute(route, { isAuthenticated, user, permissions, roles })) {
        paths.push(route.path);
      }
      if (route.children) {
        collectPaths(route.children);
      }
    });
  };

  collectPaths(routes);
  return paths;
}

// Check whether the module is accessible (there is at least one accessible route under the module)
export function isModuleAccessible(
  moduleRoutes: AppRoute[],
  isAuthenticated: boolean,
  user: User | null,
  permissions: Permission[] = [],
  roles: Role[] = []
): boolean {
  return moduleRoutes.some((route) => canAccessRoute(route, { isAuthenticated, user, permissions, roles }));
}
