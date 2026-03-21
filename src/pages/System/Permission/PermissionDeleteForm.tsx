import DeleteForm from "@/components/DataPage/DeleteForm";

interface PermissionDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const PermissionDeleteForm: React.FC<PermissionDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  return <DeleteForm onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} entityName="Permission information" isPermanent={isPermanent} />;
};

export default PermissionDeleteForm;
