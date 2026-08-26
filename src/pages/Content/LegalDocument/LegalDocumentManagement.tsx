import ManagementPage from "@/components/common/ManagementPage";
import LegalDocumentDataPage from "@/pages/Content/LegalDocument/LegalDocumentDataPage";
import { useTranslation } from "react-i18next";

const LegalDocumentManagement = () => {
  const { t } = useTranslation("content");
  return (
    <ManagementPage title={t("legalDocument.page.title")} description={t("legalDocument.page.description")}>
      <LegalDocumentDataPage />
    </ManagementPage>
  );
};

export default LegalDocumentManagement;
