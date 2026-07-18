import ManagementPage from "@/components/common/ManagementPage";
import OverrideLogDataPage from "@/pages/Facility/OverrideLog/OverrideLogDataPage";
import { useTranslation } from "react-i18next";

const OverrideLogManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("overrideLog.page.title")} description={t("overrideLog.page.description")}>
      <OverrideLogDataPage />
    </ManagementPage>
  );
};

export default OverrideLogManagement;
