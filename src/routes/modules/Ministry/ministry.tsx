import MinistryManagement from "@/pages/Ministry/Ministry/MinistryManagement";
import MinistryMemberManagement from "@/pages/Ministry/MinistryMember/MinistryMemberManagement";
import MinistryApprovalManagement from "@/pages/Ministry/Approval/MinistryApprovalManagement";
import { AppRoute } from "@/types/route";

export const ministryRoutes: AppRoute[] = [
  {
    path: "/ministry/ministries",
    element: <MinistryManagement />,
    meta: {
      title: "Ministry Management",
      description: "Ministry management",
      requiresAuth: true,
      breadcrumb: ["Ministry", "Ministries"],
    },
  },
  {
    path: "/ministry/members",
    element: <MinistryMemberManagement />,
    meta: {
      title: "Ministry Members",
      description: "Ministry steward management",
      requiresAuth: true,
      breadcrumb: ["Ministry", "Members"],
    },
  },
  {
    path: "/ministry/approvals",
    element: <MinistryApprovalManagement />,
    meta: {
      title: "Ministry Approvals",
      description: "Pending ministry approval queue",
      requiresAuth: true,
      breadcrumb: ["Ministry", "Approvals"],
    },
  },
];
