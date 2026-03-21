import DeleteForm from "@/components/DataPage/DeleteForm";

interface UserDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const UserDeleteForm: React.FC<UserDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  return <DeleteForm onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} entityName="User profile" isPermanent={isPermanent} />;
};

export default UserDeleteForm;
