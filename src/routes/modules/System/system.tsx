import ResourceManagement from "@/pages/System/Resource/ResourceManagement";
import RoleManagement from "@/pages/System/Role/RoleManagement";
import UserManagement from "@/pages/System/User/UserManagement";
import PermissionManagement from "@/pages/System/Permission/PermissionManagement";
import { AppRoute } from "@/types/route";
import Blank from "@/pages/Blank";

export const systemRoutes: AppRoute[] = [
  {
    path: "/system/users",
    element: <UserManagement />,
    meta: {
      title: "User Management",
      description: "System user management",
      requiresAuth: true,
      breadcrumb: ["System", "Users"],
    },
  },
  {
    path: "/system/resources",
    element: <ResourceManagement />,
    meta: {
      title: "Resource Management",
      description: "System resource management",
      requiresAuth: true,
      breadcrumb: ["System", "Resources"],
    },
  },
  {
    path: "/system/permissions",
    element: <PermissionManagement />,
    meta: {
      title: "Permission Management",
      description: "System permission management",
      requiresAuth: true,
      breadcrumb: ["System", "Permissions"],
    },
  },
  {
    path: "/system/roles",
    element: <RoleManagement />,
    meta: {
      title: "Role Management",
      description: "System role management",
      requiresAuth: true,
      breadcrumb: ["System", "Roles"],
    },
  },
  {
    path: "/system/fcm-devices",
    element: <Blank />,
    meta: {
      title: "FCM Device Management",
      description: "System FCM device management",
      requiresAuth: true,
      breadcrumb: ["System", "FCM Devices"],
    },
  },
  {
    path: "/system/logs",
    element: <Blank />,
    meta: {
      title: "Log Management",
      description: "System log management",
      requiresAuth: true,
      breadcrumb: ["System", "Logs"],
    },
  },
];