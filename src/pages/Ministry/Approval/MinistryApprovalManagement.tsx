import ManagementPage from "@/components/common/ManagementPage";
import MinistryApprovalDataPage from "@/pages/Ministry/Approval/MinistryApprovalDataPage";
import { useTranslation } from "react-i18next";

const MinistryApprovalManagement = () => {
  const { t } = useTranslation("ministry");
  return (
    <ManagementPage title={t("approval.page.title")} description={t("approval.page.description")}>
      <MinistryApprovalDataPage />
    </ManagementPage>
  );
};

export default MinistryApprovalManagement;
