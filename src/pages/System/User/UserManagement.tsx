import ManagementPage from "@/components/common/ManagementPage";
import UserDataPage from "@/pages/System/User/UserDataPage";
import { useTranslation } from "react-i18next";

export default function UserManagement() {
  const { t } = useTranslation();
  return (
    <ManagementPage title={t("system:user.page.title")} description={t("system:user.page.description")}>
      <UserDataPage />
    </ManagementPage>
  );
}
