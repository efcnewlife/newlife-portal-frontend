import { routeRegistry } from "../utils/route-registry";
import { IS_DEV } from "@/config/env";

// Import all route modules
import { authRoutes } from "./modules/auth";
import { dashboardRoutes } from "./modules/dashboard";
import { demoRoutes } from "./modules/demo";
import { errorRoutes } from "./modules/errors";
import { systemMenuRoutes } from "./modules/System";

// Global initialization flag
let isRoutesInitialized = false;

/**
 * Initialize route system
 * Register routes for all modules
 */
export function initializeRoutes(): void {
  // Prevent duplicate initialization
  if (isRoutesInitialized) {
    console.log("Route system already initialized, skipping duplicate initialization");
    return;
  }

  // Register all module routes (add demo module in development)
  const modules = [authRoutes, dashboardRoutes, errorRoutes, systemMenuRoutes];
  if (IS_DEV) {
    modules.push(demoRoutes);
  }
  routeRegistry.registerModules(modules);

  console.log("Route system initialization completed - all modules registered");
  console.log("Registered modules:", routeRegistry.getAllModules());

  // Show detailed info in development
  if (IS_DEV) {
    console.log("Total route count:", routeRegistry.getAllRoutes().length);
    console.log("Auth-required route count:", routeRegistry.getAuthRequiredRoutes().length);

    // Show route count per module
    routeRegistry.getAllModules().forEach((module) => {
      const routes = routeRegistry.getModuleRoutes(module);
      if (routes) {
        console.log(`Module "${module}" contains ${routes.length} routes`);
      }
    });
  }

  // Mark as initialized
  isRoutesInitialized = true;
}

/**
 * Get all registered routes
 */
export function getAllRoutes() {
  return routeRegistry.getAllRoutes();
}

/**
 * Get routes for a specific module
 */
export function getModuleRoutes(module: string) {
  return routeRegistry.getModuleRoutes(module);
}

/**
 * Get auth-required routes
 */
export function getAuthRequiredRoutes() {
  return routeRegistry.getAuthRequiredRoutes();
}

/**
 * Get route metadata by path
 */
export function getRouteMeta(path: string) {
  return routeRegistry.getRouteMeta(path);
}

/**
 * Check whether a path is registered
 */
export function isPathRegistered(path: string) {
  return routeRegistry.isPathRegistered(path);
}

// Export route registry instance
export { routeRegistry };
