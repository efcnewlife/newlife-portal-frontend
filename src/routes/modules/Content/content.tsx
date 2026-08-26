import FileManagement from "@/pages/Content/File/FileManagement";
import LegalDocumentManagement from "@/pages/Content/LegalDocument/LegalDocumentManagement";
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
  {
    path: "/content/legal-documents",
    element: <LegalDocumentManagement />,
    meta: {
      title: "Legal Documents",
      description: "Content Legal Document management",
      requiresAuth: true,
      breadcrumb: ["Content", "Legal Documents"],
    },
  },
];
