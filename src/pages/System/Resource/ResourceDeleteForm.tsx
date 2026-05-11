import { Button, TextArea } from "@efcnewlife/newlife-ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceDeleteFormProps {
  onSubmit: (data: { reason?: string; permanent?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  isPermanent?: boolean;
}

const ResourceDeleteForm: React.FC<ResourceDeleteFormProps> = ({ onSubmit, onCancel, submitting, isPermanent = false }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ reason: reason.trim() || undefined, permanent: isPermanent });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isPermanent ? t("system:resource.deleteForm.titlePermanent") : t("system:resource.deleteForm.titleSoft")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isPermanent ? t("system:resource.deleteForm.descPermanent") : t("system:resource.deleteForm.descSoft")}
        </p>
      </div>

      <div>
        <TextArea
          id="reason"
          label={t("system:resource.deleteForm.reasonLabel")}
          value={reason}
          onChange={(value) => setReason(value)}
          rows={3}
          placeholder={t("system:resource.deleteForm.reasonPlaceholder")}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button btnType="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button
          btnType="submit"
          variant="primary"
          disabled={submitting}
          className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
        >
          {submitting
            ? t("system:resource.deleteForm.submittingDeleting")
            : isPermanent
            ? t("system:resource.deleteForm.confirmPermanentButton")
            : t("common:delete")}
        </Button>
      </div>
    </form>
  );
};

export default ResourceDeleteForm;
