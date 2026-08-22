import { Button } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import type { FileDeleteAssociationGroup } from "./types";

interface FileDeleteFormProps {
  fileCount: number;
  fileNames: Record<string, string>;
  groups: FileDeleteAssociationGroup[];
  loadingPreview?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
}

const FileDeleteForm = ({
  fileCount,
  fileNames,
  groups,
  loadingPreview = false,
  onSubmit,
  onCancel,
  submitting = false,
}: FileDeleteFormProps) => {
  const { t } = useTranslation("content");
  const confirmDisabled = submitting || loadingPreview;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("file.delete.confirmMessage", { count: fileCount })}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t("file.delete.associationWarning")}</p>
      {loadingPreview ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("file.delete.loadingAssociations")}</p>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto text-sm">
          {groups.map((group) => (
            <li key={group.fileId}>
              <p className="font-medium text-gray-900 dark:text-white/90">{fileNames[group.fileId] ?? group.fileId}</p>
              {group.bindings.length === 0 ? (
                <p className="mt-1 text-gray-500 dark:text-gray-400">{t("file.delete.noAssociations")}</p>
              ) : (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-300">
                  {group.bindings.map((binding) => (
                    <li key={`${binding.resourceKind}-${binding.resourceId}`}>
                      {binding.displayName}
                      {binding.isDeleted ? ` ${t("file.delete.deletedResource")}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={onSubmit} disabled={confirmDisabled}>
          {submitting ? t("file.delete.submitting") : t("file.delete.submit")}
        </Button>
      </div>
    </div>
  );
};

export default FileDeleteForm;
