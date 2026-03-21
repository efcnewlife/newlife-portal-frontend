import ManagementPage from "@/components/common/ManagementPage";
import PermissionDataPage from "@/pages/System/Permission/PermissionDataPage";

export default function PermissionManagement() {
  return (
    <ManagementPage title="Permission management" description="Manage system permissions">
      <PermissionDataPage />
    </ManagementPage>
  );
}
