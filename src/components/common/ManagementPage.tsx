import PageMeta from "@/components/common/PageMeta";
import { usePageHeader } from "@/context/PageHeaderContext";
import { ReactNode, useEffect } from "react";

interface ManagementPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

const ManagementPage: React.FC<ManagementPageProps> = ({ title, description, children }) => {
  const { setPageTitle } = usePageHeader();

  // Publish the page title to the header breadcrumb; clear it on unmount.
  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle("");
  }, [title, setPageTitle]);

  return (
    <div className="flex h-[calc(100vh-120px)] min-w-0 w-full max-w-full flex-col gap-3">
      <PageMeta title={title} description={description} />
      <div className="min-h-0 min-w-0 w-full flex-1">{children}</div>
    </div>
  );
};

export default ManagementPage;
