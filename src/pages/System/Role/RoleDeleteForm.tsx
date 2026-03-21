import DeleteForm from "@/components/DataPage/DeleteForm";

interface RoleDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const RoleDeleteForm: React.FC<RoleDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  return <DeleteForm onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} entityName="character profile" isPermanent={isPermanent} />;
};

export default RoleDeleteForm;
