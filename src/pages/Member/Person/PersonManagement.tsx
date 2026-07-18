import ManagementPage from "@/components/common/ManagementPage";
import PersonDataPage from "@/pages/Member/Person/PersonDataPage";
import { useTranslation } from "react-i18next";

const PersonManagement = () => {
  const { t } = useTranslation("member");
  return (
    <ManagementPage title={t("person.page.title")} description={t("person.page.description")}>
      <PersonDataPage />
    </ManagementPage>
  );
};

export default PersonManagement;
