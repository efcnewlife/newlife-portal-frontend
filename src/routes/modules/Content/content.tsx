import FileManagement from "@/pages/Content/File/FileManagement";
import { AppRoute } from "@/types/route";

export const contentRoutes: AppRoute[] = [
  {
    path: "/content/files",
    element: <FileManagement />,
    meta: {
      title: "File Management",
      description: "Content file management",
      requiresAuth: true,
      breadcrumb: ["Content", "Files"],
    },
  },
];
