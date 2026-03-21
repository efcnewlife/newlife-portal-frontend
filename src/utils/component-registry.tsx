import Blank from "@/pages/Blank";
import Dashboard from "@/pages/Dashboard";
import PermissionManagement from "@/pages/System/Permission/PermissionManagement";
import ResourceManagement from "@/pages/System/Resource/ResourceManagement";
import RoleManagement from "@/pages/System/Role/RoleManagement";
import UserManagement from "@/pages/System/User/UserManagement";
import React from "react";

// Register routable components keyed by backend resource key
const componentRegistry: Record<string, React.ComponentType> = {
  // Dashboard - main homepage
  DASHBOARD: Dashboard,
  // System
  SYSTEM_USER: UserManagement,
  SYSTEM_RESOURCE: ResourceManagement,
  SYSTEM_PERMISSION: PermissionManagement,
  SYSTEM_ROLE: RoleManagement,
  SYSTEM_FCM_DEVICE: Blank,
  SYSTEM_LOG: Blank,
};

function normalizeKey(key: string): string {
  return key?.trim();
}

export function resolveRouteElementByKey(key: string): React.ReactElement {
  const normalizedKey = normalizeKey(key);
  const Component = componentRegistry[normalizedKey];

  if (Component) {
    return React.createElement(Component);
  }

  // Return default Blank component when no mapped component is found
  // console.warn(`Component not found for key: "${key}", using Blank component`);
  return React.createElement(Blank);
}

export type {};
