import { Button } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface FileDeleteFormProps {
  fileCount: number;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
}

const FileDeleteForm = ({ fileCount, onSubmit, onCancel, submitting = false }: FileDeleteFormProps) => {
  const { t } = useTranslation("content");

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("file.delete.confirmMessage", { count: fileCount })}
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={onSubmit} disabled={submitting}>
          {submitting ? t("file.delete.submitting") : t("file.delete.submit")}
        </Button>
      </div>
    </div>
  );
};

export default FileDeleteForm;
