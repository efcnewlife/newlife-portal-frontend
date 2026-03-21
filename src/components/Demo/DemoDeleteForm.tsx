import DeleteForm from "@/components/DataPage/DeleteForm";

interface DemoDeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const DemoDeleteForm: React.FC<DemoDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  return <DeleteForm onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} entityName="demo item" isPermanent={isPermanent} />;
};

export default DemoDeleteForm;
