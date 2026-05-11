import DeleteForm from "@/components/DataPage/DeleteForm";
import { useTranslation } from "react-i18next";

interface RoleDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const RoleDeleteForm: React.FC<RoleDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  const { t } = useTranslation();
  return (
    <DeleteForm onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} entityName={t("system:role.deleteForm.entityLabel")} isPermanent={isPermanent} />
  );
};

export default RoleDeleteForm;
