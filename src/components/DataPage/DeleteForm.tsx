import { Button, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DeleteFormProps {
  onSubmit: (payload: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  entityName?: string;
  isPermanent?: boolean;
  /** Soft-delete warning body; defaults to common soft-delete warning with entityName. */
  softWarningBody?: string;
}

const DeleteForm: React.FC<DeleteFormProps> = ({
  onSubmit,
  onCancel,
  submitting,
  entityName = "material",
  isPermanent = false,
  softWarningBody,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [reason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPermanent && reason.trim().length === 0) {
      setError(t("common:forms.delete.reasonRequiredSoftDeletion"));
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
            label={t("common:forms.delete.reasonLabelSoftDeletion")}
            rows={3}
            placeholder={t("common:forms.delete.reasonPlaceholderSoftDeletion")}
            value={reason}
            onChange={(value) => setReason(value)}
            error={error || undefined}
          />
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {isPermanent ? t("common:forms.delete.warningTitlePermanent") : t("common:forms.delete.warningTitleSoft")}
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              {isPermanent ? (
                <p>{t("common:forms.delete.warningBodyPermanent", { entityName })}</p>
              ) : (
                <p>{softWarningBody ?? t("common:forms.delete.warningBodySoft", { entityName })}</p>
              )}
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
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-300"
        >
          {isPermanent ? t("common:forms.delete.confirmPermanent") : t("common:forms.delete.confirmSoft")}
        </Button>
      </div>
    </form>
  );
};

export default DeleteForm;
