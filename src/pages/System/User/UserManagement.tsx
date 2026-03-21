import ManagementPage from "@/components/common/ManagementPage";
import UserDataPage from "@/pages/System/User/UserDataPage";

export default function UserManagement() {
  return (
    <ManagementPage title="User management" description="Manage system users">
      <UserDataPage />
    </ManagementPage>
  );
}
