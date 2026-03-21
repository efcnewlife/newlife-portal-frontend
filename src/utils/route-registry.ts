import { AppRoute, ModuleRoute, RouteRegistry } from "../types/route";
import { IS_DEV } from "@/config/env";

class RouteRegistryManager {
  private registry: RouteRegistry = {};
  private registeredPaths: Set<string> = new Set();

  /**
   * Register module route
   * @param moduleRoute Module routing configuration
   */
  registerModule(moduleRoute: ModuleRoute): void {
    const { module, routes } = moduleRoute;

    // Check whether the module already exists, if it exists, clear the old path first
    if (this.registry[module]) {
      console.warn(`Module "${module}" is already registered. Clearing old routes and re-registering...`);
      // Clear paths for old mods
      const oldRoutes = this.registry[module].routes;
      this.unregisterPaths(oldRoutes);
    }

    // Check if routing paths are duplicated
    this.validateRoutes(routes);

    // Register module
    this.registry[module] = moduleRoute;

    // record all paths
    this.registerPaths(routes);
  }

  /**
   * Register multiple modules
   * @param modules Module routing configuration array
   */
  registerModules(modules: ModuleRoute[]): void {
    modules.forEach((module) => this.registerModule(module));
  }

  /**
   * Get all registered routes
   */
  getAllRoutes(): AppRoute[] {
    const allRoutes: AppRoute[] = [];

    Object.values(this.registry).forEach((moduleRoute) => {
      allRoutes.push(...moduleRoute.routes);
    });

    return allRoutes;
  }

  /**
   * Get the route of the specified module
   * @param module Module name
   */
  getModuleRoutes(module: string): AppRoute[] | undefined {
    return this.registry[module]?.routes;
  }

  /**
   * Get all mods
   */
  getAllModules(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * Check if the path is registered
   * @param path path
   */
  isPathRegistered(path: string): boolean {
    return this.registeredPaths.has(path);
  }

  /**
   * Get route metadata based on path
   * @param path path
   */
  getRouteMeta(path: string): any {
    for (const moduleRoute of Object.values(this.registry)) {
      const route = this.findRouteByPath(moduleRoute.routes, path);
      if (route) {
        return route.meta;
      }
    }
    return null;
  }

  /**
   * Get routes that require authentication
   */
  getAuthRequiredRoutes(): AppRoute[] {
    const authRoutes: AppRoute[] = [];

    Object.values(this.registry).forEach((moduleRoute) => {
      moduleRoute.routes.forEach((route) => {
        if (route.meta?.requiresAuth) {
          authRoutes.push(route);
        }
      });
    });

    return authRoutes;
  }

  /**
   * Get module metadata
   * @param module Module name
   */
  getModuleMeta(module: string): any {
    return this.registry[module]?.meta;
  }

  /**
   * Get metadata for all mods
   */
  getAllModulesMeta(): Record<string, any> {
    const meta: Record<string, any> = {};
    Object.keys(this.registry).forEach((module) => {
      meta[module] = this.registry[module]?.meta;
    });
    return meta;
  }

  /**
   * Clear all registered routes
   */
  clear(): void {
    this.registry = {};
    this.registeredPaths.clear();
  }

  /**
   * Verify routing path
   * @param routes routing array
   */
  private validateRoutes(routes: AppRoute[]): void {
    routes.forEach((route) => {
      if (this.registeredPaths.has(route.path)) {
        // In a development environment, only warnings are displayed and no errors are thrown.
        if (IS_DEV) {
          console.warn(`Route path "${route.path}" is already registered. This might be due to React Strict Mode.`);
        } else {
          throw new Error(`Route path "${route.path}" is already registered`);
        }
      }

      if (route.children) {
        this.validateRoutes(route.children);
      }
    });
  }

  /**
   * Register the path into the collection
   * @param routes routing array
   */
  private registerPaths(routes: AppRoute[]): void {
    routes.forEach((route) => {
      this.registeredPaths.add(route.path);

      if (route.children) {
        this.registerPaths(route.children);
      }
    });
  }

  /**
   * Remove path from collection
   * @param routes routing array
   */
  private unregisterPaths(routes: AppRoute[]): void {
    routes.forEach((route) => {
      this.registeredPaths.delete(route.path);

      if (route.children) {
        this.unregisterPaths(route.children);
      }
    });
  }

  /**
   * Find route based on path
   * @param routes routing array
   * @param path path
   */
  private findRouteByPath(routes: AppRoute[], path: string): AppRoute | null {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }

      if (route.children) {
        const found = this.findRouteByPath(route.children, path);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Get additional routes for the development environment
   */
  getDevRoutes(): AppRoute[] {
    if (IS_DEV) {
      // The development environment can add additional routes
      return [];
    }
    return [];
  }
}

// Create a singleton instance
export const routeRegistry = new RouteRegistryManager();

// Export type
export type { AppRoute, ModuleRoute, RouteRegistry };
