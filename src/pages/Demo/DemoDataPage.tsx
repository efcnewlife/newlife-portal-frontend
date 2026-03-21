import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import DemoDataPage from "@/components/Demo/DemoDataPage";

export default function DemoDataPageView() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-3">
      <PageMeta title="Demo Data" description="Demo data page (development only)" />
      <PageBreadcrumb pageTitle="Demo" />
      <DemoDataPage />
    </div>
  );
}
