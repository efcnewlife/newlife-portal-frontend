import ManagementPage from "@/components/common/ManagementPage";
import ResourcePage from "@/pages/System/Resource/ResourcePage";

export default function ResourceManagement() {
  return (
    <ManagementPage title="Resource management" description="Manage system resources and permissions">
      <ResourcePage />
    </ManagementPage>
  );
}
