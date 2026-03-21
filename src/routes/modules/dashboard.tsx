import { MdDashboard } from "react-icons/md";
import Dashboard from "../../pages/Dashboard";
import UserProfile from "../../pages/UserProfile";
import { ModuleRoute } from "../../types/route";

export const dashboardRoutes: ModuleRoute = {
  module: "dashboard",
  meta: {
    title: "Dashboard",
    description: "Main dashboard page",
    icon: <MdDashboard />,
  },
  routes: [
    {
      path: "/",
      element: <Dashboard />,
      meta: {
        title: "Dashboard",
        description: "Main dashboard page",
        requiresAuth: true,
        breadcrumb: ["Dashboard"],
      },
    },
    {
      path: "/profile",
      element: <UserProfile />,
      meta: {
        title: "User Profile",
        description: "User profile and settings page",
        requiresAuth: true,
        breadcrumb: ["User Profile"],
      },
    },
  ],
};
