import ManagementPage from "@/components/common/ManagementPage";
import PermissionDataPage from "@/pages/System/Permission/PermissionDataPage";
import { useTranslation } from "react-i18next";

export default function PermissionManagement() {
  const { t } = useTranslation();
  return (
    <ManagementPage title={t("system:permission.page.title")} description={t("system:permission.page.description")}>
      <PermissionDataPage />
    </ManagementPage>
  );
}
