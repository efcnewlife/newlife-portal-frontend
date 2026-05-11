import ManagementPage from "@/components/common/ManagementPage";
import RoleDataPage from "@/pages/System/Role/RoleDataPage";
import { useTranslation } from "react-i18next";

export default function RoleManagement() {
  const { t } = useTranslation();
  return (
    <ManagementPage title={t("system:role.page.title")} description={t("system:role.page.description")}>
      <RoleDataPage />
    </ManagementPage>
  );
}
