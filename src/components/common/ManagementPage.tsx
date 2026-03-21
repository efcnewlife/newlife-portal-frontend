import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { ReactNode } from "react";

interface ManagementPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

const ManagementPage: React.FC<ManagementPageProps> = ({ title, description, children }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-3">
      <PageMeta title={title} description={description} />
      <PageBreadcrumb pageTitle={title} />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
};

export default ManagementPage;

