import PositionManagement from "@/pages/Org/Position/PositionManagement";
import PersonManagement from "@/pages/Member/Person/PersonManagement";
import { AppRoute } from "@/types/route";

export const orgRoutes: AppRoute[] = [
  {
    path: "/org/positions",
    element: <PositionManagement />,
    meta: {
      title: "Positions",
      description: "Church leadership positions",
      requiresAuth: true,
      breadcrumb: ["Organization", "Positions"],
    },
  },
  {
    path: "/org/members",
    element: <PersonManagement />,
    meta: {
      title: "Member",
      description: "Manage church members",
      requiresAuth: true,
      breadcrumb: ["Organization", "Member"],
    },
  },
];
