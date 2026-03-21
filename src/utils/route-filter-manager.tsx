// Route filter manager - handles startup route filtering and dynamic route rebuilding
import { FullPageLoading } from "@/components/common/LoadingSpinner";
import AppLayout from "@/layout/AppLayout";
import NotFound from "@/pages/OtherPage/NotFound";
import { getAllRoutes } from "@/routes";
import type { Permission, Role, User } from "@/types/auth";
import type { ResourceMenuItem } from "@/types/resource-admin";
import type { AppRoute } from "@/types/route";
import { createBrowserRouter, Navigate } from "react-router";
import { resolveRouteElementByKey } from "./component-registry";
import { resolveIcon } from "./icon-resolver";
import { filterRoutesByAuth, getPublicRoutes } from "./route-filter";

// Route filter state
interface RouteFilterState {
  isInitialized: boolean;
  isFiltering: boolean;
  filteredRoutes: AppRoute[];
  publicRoutes: AppRoute[];
  error: string | null;
  lastFilterTime: number | null;
  isAuthenticated: boolean;
}

// Route filter options
interface RouteFilterOptions {
  isAuthenticated: boolean;
  user: User | null;
  permissions: Permission[];
  roles: Role[];
  menus?: ResourceMenuItem[] | null;
  forceRefresh?: boolean;
}

class RouteFilterManager {
  private state: RouteFilterState = {
    isInitialized: false,
    isFiltering: false,
    filteredRoutes: [],
    publicRoutes: [],
    error: null,
    lastFilterTime: null,
    isAuthenticated: false,
  };

  private listeners: Set<(state: RouteFilterState) => void> = new Set();

  private buildRoutesFromMenus(items: ResourceMenuItem[]): AppRoute[] {
    // Convert only to first-level routes; extend group/pid for nested routing if needed
    return items
      .filter((it) => !!it.path)
      .map<AppRoute>((it) => ({
        path: it.path!,
        element: resolveRouteElementByKey(it.key),
        meta: {
          title: it.name,
          icon: resolveIcon(it.icon || "").icon,
          requiresAuth: true,
          order: it.sequence ? Math.floor(it.sequence) : undefined,
        },
      }));
  }

  // Initialize route filtering
  async initializeRoutes(options: RouteFilterOptions): Promise<void> {
    try {
      this.setState({ isFiltering: true, error: null });

      // Get all static routes
      const allRoutes = getAllRoutes();

      // Split public routes
      const publicRoutes = getPublicRoutes(allRoutes);

      let filteredRoutes: AppRoute[] = [];

      if (options.isAuthenticated) {
        // Authenticated: use provided menu data or fallback to static routes
        if (options.menus && Array.isArray(options.menus)) {
          const dynamicRoutes = this.buildRoutesFromMenus(options.menus);
          // Merge static protected routes (if still needed) with dynamic routes
          const staticProtected = filterRoutesByAuth(allRoutes, true, options.user, options.permissions, options.roles).filter(
            (r) => r.meta?.requiresAuth !== false,
          );
          const merged = [...staticProtected, ...dynamicRoutes];
          // Deduplicate by path (prefer dynamic routes)
          const seen = new Set<string>();
          filteredRoutes = merged
            .reverse()
            .filter((r) => {
              if (seen.has(r.path)) return false;
              seen.add(r.path);
              return true;
            })
            .reverse();
        } else {
          // Fallback to static protected routes when no menu data exists
          filteredRoutes = filterRoutesByAuth(allRoutes, true, options.user, options.permissions, options.roles);
        }
      } else {
        // Show only public routes when unauthenticated
        filteredRoutes = publicRoutes;
      }

      this.setState({
        isInitialized: true,
        isFiltering: false,
        filteredRoutes,
        publicRoutes,
        lastFilterTime: Date.now(),
        isAuthenticated: options.isAuthenticated,
      });

      console.log(`🔧 Routes filtered: ${filteredRoutes.length} accessible routes`);
    } catch (error) {
      console.error("Failed to initialize routes:", error);
      this.setState({
        isFiltering: false,
        error: error instanceof Error ? error.message : "Failed to initialize routes",
      });
    }
  }

  // Re-filter routes (used after permission changes)
  async refreshRoutes(options: RouteFilterOptions): Promise<void> {
    console.log("🔄 Refreshing routes...");
    await this.initializeRoutes({ ...options, forceRefresh: true });
  }

  // Create route config
  createRouteConfig(): ReturnType<typeof createBrowserRouter> {
    const { filteredRoutes, isInitialized, isFiltering, error, isAuthenticated } = this.state;

    if (!isInitialized || isFiltering) {
      // Return loading route while loading or before initialization
      return createBrowserRouter([
        {
          path: "*",
          element: <FullPageLoading text="Initializing routes..." />,
        },
      ]);
    }

    if (error) {
      // Return error route when initialization fails
      return createBrowserRouter([
        {
          path: "*",
          element: (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Route Initialization Failed</h1>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Reload
                </button>
              </div>
            </div>
          ),
        },
      ]);
    }

    const config: Array<{
      path: string;
      element: React.ReactNode;
      children?: Array<{
        path?: string;
        index?: boolean;
        element: React.ReactNode;
      }>;
    }> = [];

    // Unauthenticated: create only public routes and redirect rules
    if (!isAuthenticated) {
      // Add public routes (e.g. /signin), excluding wildcard route
      const publicRoutes = filteredRoutes.filter((route) => route.meta?.requiresAuth === false && route.path !== "*");

      config.push(
        ...publicRoutes.map((route) => ({
          path: route.path,
          element: route.element,
        })),
      );

      // Add redirect rules - redirect all other paths to /signin
      config.push({ path: "/", element: <Navigate to="/signin" replace /> });
      config.push({ path: "*", element: <Navigate to="/signin" replace /> });

      return createBrowserRouter(config);
    }

    // Authenticated: build full route config
    const layoutRoutes = filteredRoutes.filter((route) => route.meta?.requiresAuth !== false);
    const standaloneRoutes = filteredRoutes.filter((route) => route.meta?.requiresAuth === false);

    // Create layout route when layout-required routes exist
    if (layoutRoutes.length > 0) {
      config.push({
        path: "/",
        element: <AppLayout />,
        children: layoutRoutes.map((route) => {
          if (route.path === "/") {
            return {
              index: true,
              element: route.element,
            };
          }
          return {
            path: route.path,
            element: route.element,
          };
        }),
      });
    }

    // Add standalone routes (no layout required)
    config.push(
      ...standaloneRoutes.map((route) => ({
        path: route.path,
        element: route.element,
      })),
    );

    // Ensure root path has dashboard route when authenticated
    if (isAuthenticated && layoutRoutes.length > 0) {
      // Check whether root path is already configured
      const hasRootRoute = config.some((route) => route.children && route.children.some((child) => child.index === true));
      if (!hasRootRoute) {
        // Add default dashboard if root path is missing
        const dashboardRoute = layoutRoutes.find((route) => route.path === "/");
        if (dashboardRoute && config[0] && Array.isArray(config[0].children)) {
          config[0].children.unshift({
            index: true,
            element: dashboardRoute.element,
          });
        }
      }
    }

    // If authenticated and user is still on sign-in page, redirect to root
    if (isAuthenticated) {
      config.push({ path: "/signin", element: <Navigate to="/" replace /> });
    }

    // Add 404 route when authenticated
    config.push({
      path: "*",
      element: <NotFound />,
    });

    return createBrowserRouter(config);
  }

  // Check whether a path is accessible
  isPathAccessible(path: string): boolean {
    const { filteredRoutes } = this.state;
    return filteredRoutes.some((route) => route.path === path);
  }

  // Get accessible path list
  getAccessiblePaths(): string[] {
    const { filteredRoutes } = this.state;
    return filteredRoutes.map((route) => route.path);
  }

  // Get filter state
  getState(): RouteFilterState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: RouteFilterState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Set state
  private setState(updates: Partial<RouteFilterState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error("Error in route filter listener:", error);
      }
    });
  }

  // Reset state
  reset(): void {
    this.state = {
      isInitialized: false,
      isFiltering: false,
      filteredRoutes: [],
      publicRoutes: [],
      error: null,
      lastFilterTime: null,
      isAuthenticated: false,
    };
    this.notifyListeners();
  }
}

// Create global route filter manager instance
export const routeFilterManager = new RouteFilterManager();

// Route filter hook
export function useRouteFilter() {
  const [state, setState] = useState(routeFilterManager.getState());

  useEffect(() => {
    const unsubscribe = routeFilterManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    refreshRoutes: routeFilterManager.refreshRoutes.bind(routeFilterManager),
    isPathAccessible: routeFilterManager.isPathAccessible.bind(routeFilterManager),
    getAccessiblePaths: routeFilterManager.getAccessiblePaths.bind(routeFilterManager),
  };
}

// Import required React hooks
import { useEffect, useState } from "react";
