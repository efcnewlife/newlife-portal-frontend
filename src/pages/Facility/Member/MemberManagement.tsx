import ManagementPage from "@/components/common/ManagementPage";
import MemberDataPage from "@/pages/Facility/Member/MemberDataPage";
import { useTranslation } from "react-i18next";

const MemberManagement = () => {
  const { t } = useTranslation("facility");
  return (
    <ManagementPage title={t("member.page.title")} description={t("member.page.description")}>
      <MemberDataPage />
    </ManagementPage>
  );
};

export default MemberManagement;
