import { Button } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface RestoreFormProps {
  onSubmit: (ids: string[]) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  entityName?: string;
  ids: string[];
}

const RestoreForm: React.FC<RestoreFormProps> = ({ onSubmit, onCancel, submitting, entityName = "material", ids }) => {
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(ids);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t("common:forms.restore.title")}</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>{t("common:forms.restore.intro", { count: ids.length, entityName })}</p>
              <p className="mt-1 font-medium">{t("common:forms.restore.prompt")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} size="sm" variant="outline" disabled={!!submitting}>
          {t("common:cancel")}
        </Button>
        <Button
          btnType="submit"
          size="sm"
          variant="primary"
          disabled={!!submitting}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300"
        >
          {submitting ? t("common:forms.restore.restoring") : t("common:forms.restore.confirm")}
        </Button>
      </div>
    </form>
  );
};

export default RestoreForm;
