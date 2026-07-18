import ManagementPage from "@/components/common/ManagementPage";
import BookingDataPage from "@/pages/Facility/Booking/BookingDataPage";
import { useTranslation } from "react-i18next";

const BookingManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("booking.page.title")} description={t("booking.page.description")}>
      <BookingDataPage />
    </ManagementPage>
  );
};

export default BookingManagement;
