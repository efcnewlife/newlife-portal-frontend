import ManagementPage from "@/components/common/ManagementPage";
import MinistryMemberDataPage from "@/pages/Ministry/MinistryMember/MinistryMemberDataPage";
import { useTranslation } from "react-i18next";

const MinistryMemberManagement = () => {
  const { t } = useTranslation("ministry");
  return (
    <ManagementPage title={t("ministryMember.page.title")} description={t("ministryMember.page.description")}>
      <MinistryMemberDataPage />
    </ManagementPage>
  );
};

export default MinistryMemberManagement;
