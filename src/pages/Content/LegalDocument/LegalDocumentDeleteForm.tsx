import DeleteForm from "@/components/DataPage/DeleteForm";
import { useTranslation } from "react-i18next";

interface LegalDocumentDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const LegalDocumentDeleteForm = ({
  onSubmit,
  onCancel,
  submitting,
  isPermanent = false,
}: LegalDocumentDeleteFormProps) => {
  const { t } = useTranslation("content");
  return (
    <DeleteForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitting={submitting}
      entityName={t("legalDocument.deleteForm.entityLabel")}
      isPermanent={isPermanent}
      softWarningBody={isPermanent ? undefined : t("legalDocument.deleteForm.publicReadWarning")}
    />
  );
};

export default LegalDocumentDeleteForm;
