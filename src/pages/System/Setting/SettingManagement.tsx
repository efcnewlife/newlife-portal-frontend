import ManagementPage from "@/components/common/ManagementPage";
import SettingDataPage from "@/pages/System/Setting/SettingDataPage";
import { useTranslation } from "react-i18next";

export default function SettingManagement() {
  const { t } = useTranslation();
  return (
    <ManagementPage title={t("system:setting.page.title")} description={t("system:setting.page.description")}>
      <SettingDataPage />
    </ManagementPage>
  );
}
