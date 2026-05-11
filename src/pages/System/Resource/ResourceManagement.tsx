import ManagementPage from "@/components/common/ManagementPage";
import ResourcePage from "@/pages/System/Resource/ResourcePage";
import { useTranslation } from "react-i18next";

export default function ResourceManagement() {
  const { t } = useTranslation();
  return (
    <ManagementPage title={t("system:resource.page.title")} description={t("system:resource.page.description")}>
      <ResourcePage />
    </ManagementPage>
  );
}
