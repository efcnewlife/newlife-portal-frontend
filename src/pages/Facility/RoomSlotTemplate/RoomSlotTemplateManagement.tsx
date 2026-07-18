import ManagementPage from "@/components/common/ManagementPage";
import RoomSlotTemplateDataPage from "@/pages/Facility/RoomSlotTemplate/RoomSlotTemplateDataPage";
import { useTranslation } from "react-i18next";

const RoomSlotTemplateManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("roomSlotTemplate.page.title")} description={t("roomSlotTemplate.page.description")}>
      <RoomSlotTemplateDataPage />
    </ManagementPage>
  );
};

export default RoomSlotTemplateManagement;
