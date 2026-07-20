import ManagementPage from "@/components/common/ManagementPage";
import FileDataPage from "@/pages/Content/File/FileDataPage";
import { useTranslation } from "react-i18next";

const FileManagement = () => {
  const { t } = useTranslation("content");
  return (
    <ManagementPage title={t("file.page.title")} description={t("file.page.description")}>
      <FileDataPage />
    </ManagementPage>
  );
};

export default FileManagement;
