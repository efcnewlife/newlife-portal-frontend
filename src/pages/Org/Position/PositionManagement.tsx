import ManagementPage from "@/components/common/ManagementPage";
import PositionDataPage from "@/pages/Org/Position/PositionDataPage";
import { useTranslation } from "react-i18next";

const PositionManagement = () => {
  const { t } = useTranslation("org");
  return (
    <ManagementPage title={t("position.page.title")} description={t("position.page.description")}>
      <PositionDataPage />
    </ManagementPage>
  );
};

export default PositionManagement;
