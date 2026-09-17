import ManagementPage from "@/components/common/ManagementPage";
import RecurringSeriesDetailPage from "@/pages/Facility/BookingSeries/RecurringSeriesDetailPage";
import { useTranslation } from "react-i18next";

const RecurringSeriesManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("bookingSeries.page.title")} description={t("bookingSeries.page.description")}>
      <RecurringSeriesDetailPage />
    </ManagementPage>
  );
};

export default RecurringSeriesManagement;
