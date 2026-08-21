import { Button, Radio } from "@efcnewlife/newlife-ui";
import type { ResourceMenuItem } from "@/types/resource";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceChangeParentFormProps {
  rootResources: ResourceMenuItem[];
  currentResource: ResourceMenuItem;
  onSubmit: (parentId: string) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const ResourceChangeParentForm: React.FC<ResourceChangeParentFormProps> = ({
  rootResources,
  currentResource,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const { t } = useTranslation();
  const [selectedParentId, setSelectedParentId] = useState<string>(currentResource.pid || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParentId) {
      await onSubmit(selectedParentId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
          <svg
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t("system:resource.changeParentForm.titleHeading")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("system:resource.changeParentForm.instruction", { name: currentResource.name })}
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {rootResources.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t("system:resource.changeParentForm.noRoots")}
          </p>
        ) : (
          rootResources.map((resource) => (
            <Radio
              key={resource.id}
              id={`parent-${resource.id}`}
              name="parent"
              value={resource.id}
              checked={selectedParentId === resource.id}
              label={resource.name}
              onChange={(value) => setSelectedParentId(value as string)}
              disabled={submitting}
            />
          ))
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button btnType="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button
          btnType="submit"
          variant="primary"
          disabled={submitting || !selectedParentId || selectedParentId === currentResource.pid}
        >
          {submitting
            ? t("system:resource.changeParentForm.processingButton")
            : t("system:resource.changeParentForm.confirmButton")}
        </Button>
      </div>
    </form>
  );
};

export default ResourceChangeParentForm;
