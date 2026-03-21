import { ReactNode } from "react";

export interface RouteMeta {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  requiresAuth?: boolean;
  roles?: string[];
  permissions?: string[]; // Added permission check support
  breadcrumb?: string[];
  hidden?: boolean;
  order?: number;
  devOnly?: boolean; // Only shown in development environment
}

export interface AppRoute {
  path: string;
  element: ReactNode;
  meta?: RouteMeta;
  children?: AppRoute[];
}

export interface ModuleRoute {
  module: string;
  routes: AppRoute[];
  meta?: {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    order?: number;
  };
}

export interface RouteRegistry {
  [module: string]: ModuleRoute;
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType<unknown>;
  meta?: RouteMeta;
  children?: RouteConfig[];
}
