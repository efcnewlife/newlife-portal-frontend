import DeleteForm from "@/components/DataPage/DeleteForm";
import { useTranslation } from "react-i18next";

interface UserDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const UserDeleteForm: React.FC<UserDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  const { t } = useTranslation();
  return (
    <DeleteForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitting={submitting}
      entityName={t("system:user.deleteForm.entityLabel")}
      isPermanent={isPermanent}
    />
  );
};

export default UserDeleteForm;
