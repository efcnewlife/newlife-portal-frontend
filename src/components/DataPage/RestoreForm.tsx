import Button from "../ui/button";

interface RestoreFormProps {
  onSubmit: (ids: string[]) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  entityName?: string; // Entity name, used to confirm text
  ids: string[]; // To be restored ID list
}

const RestoreForm: React.FC<RestoreFormProps> = ({ onSubmit, onCancel, submitting, entityName = "material", ids }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(ids);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Restore confirmation</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                You are about to restore {ids.length} indivual{entityName}，This operation will resume{entityName}normal state.
              </p>
              <p className="mt-1 font-medium">Please confirm whether you want to continue this operation?</p>
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
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300"
        >
          {submitting ? "Restoring..." : "Confirm restore"}
        </Button>
      </div>
    </form>
  );
};

export default RestoreForm;
