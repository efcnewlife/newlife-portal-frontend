import { Button, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useState } from "react";

interface DeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  entityName?: string; // Entity name, used for warning text
  isPermanent?: boolean; // Is it in permanent deletion mode?
}

const DeleteForm: React.FC<DeleteFormProps> = ({ onSubmit, onCancel, submitting, entityName = "material", isPermanent = false }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [reason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPermanent && reason.trim().length === 0) {
      setError("The reason needs to be filled in when soft deleting");
      return;
    }
    await onSubmit({ reason: reason.trim() || undefined, permanent: isPermanent });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isPermanent && (
        <div>
          <TextArea
            id="delete-reason"
            label="Reason for deletion (required for soft deletion)"
            rows={3}
            placeholder="Please enter the reason for deletion"
            value={reason}
            onChange={(value) => setReason(value)}
            error={error || undefined}
          />
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{isPermanent ? "Permanent removal warning" : "Soft delete instructions"}</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              {isPermanent ? (
                <p>After permanent deletion,{entityName}It will not be restored, so please proceed with caution.</p>
              ) : (
                <p>After soft deletion,{entityName}Will be marked as deleted but can be restored via the restore function.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} size="sm" variant="outline" disabled={!!submitting}>
          Cancel
        </Button>
        <Button
          btnType="submit"
          size="sm"
          variant="primary"
          disabled={!!submitting}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-300"
        >
          {isPermanent ? "Confirm permanent deletion" : "Confirm deletion"}
        </Button>
      </div>
    </form>
  );
};

export default DeleteForm;
