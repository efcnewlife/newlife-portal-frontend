import ManagementPage from "@/components/common/ManagementPage";
import RoomBlackoutDataPage from "@/pages/Facility/RoomBlackout/RoomBlackoutDataPage";
import { useTranslation } from "react-i18next";

const RoomBlackoutManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("roomBlackout.page.title")} description={t("roomBlackout.page.description")}>
      <RoomBlackoutDataPage />
    </ManagementPage>
  );
};

export default RoomBlackoutManagement;
