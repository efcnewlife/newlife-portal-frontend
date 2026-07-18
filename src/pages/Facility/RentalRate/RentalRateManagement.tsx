import ManagementPage from "@/components/common/ManagementPage";
import RentalRateDataPage from "@/pages/Facility/RentalRate/RentalRateDataPage";
import { useTranslation } from "react-i18next";

const RentalRateManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("rentalRate.page.title")} description={t("rentalRate.page.description")}>
      <RentalRateDataPage />
    </ManagementPage>
  );
};

export default RentalRateManagement;
