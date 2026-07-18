import DeleteForm from "@/components/DataPage/DeleteForm";
import { useTranslation } from "react-i18next";

interface RoomDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const RoomDeleteForm = ({ onSubmit, onCancel, submitting, isPermanent = false }: RoomDeleteFormProps) => {
  const { t } = useTranslation("facility");
  return (
    <DeleteForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitting={submitting}
      entityName={t("room.deleteForm.entityLabel")}
      isPermanent={isPermanent}
    />
  );
};

export default RoomDeleteForm;
