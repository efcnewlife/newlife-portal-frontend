import ManagementPage from "@/components/common/ManagementPage";
import MinistryDataPage from "@/pages/Ministry/Ministry/MinistryDataPage";
import { useTranslation } from "react-i18next";

const MinistryManagement = () => {
  const { t } = useTranslation("ministry");
  return (
    <ManagementPage title={t("ministry.page.title")} description={t("ministry.page.description")}>
      <MinistryDataPage />
    </ManagementPage>
  );
};

export default MinistryManagement;
