import ManagementPage from "@/components/common/ManagementPage";
import RoleDataPage from "@/pages/System/Role/RoleDataPage";

export default function RoleManagement() {
  return (
    <ManagementPage title="role management" description="Management system roles">
      <RoleDataPage />
    </ManagementPage>
  );
}
