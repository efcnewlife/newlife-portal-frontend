import ManagementPage from "@/components/common/ManagementPage";
import RoomDataPage from "@/pages/Facility/Room/RoomDataPage";
import { useTranslation } from "react-i18next";

const RoomManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("room.page.title")} description={t("room.page.description")}>
      <RoomDataPage />
    </ManagementPage>
  );
};

export default RoomManagement;
