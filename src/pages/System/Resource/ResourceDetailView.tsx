import { resourceService } from "@/api";
import type { ResourceMenuItem } from "@/api/services/resourceService";
import { AdminResourceType } from "@/api/services/resourceService";
import { Checkbox, Input, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceDetailViewProps {
  resourceId: string;
}

const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({ resourceId }) => {
  const { t } = useTranslation();
  const [resource, setResource] = useState<ResourceMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await resourceService.getResource(resourceId);
        if (response.success) {
          setResource(response.data);
        } else {
          setError(response.message || t("system:resource.detail.loadFailedFallback"));
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (resourceId) {
      void fetchResource();
    }
  }, [resourceId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t("system:resource.detail.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("system:resource.detail.notFound")}</p>
      </div>
    );
  }

  const getTypeText = (type: AdminResourceType) => {
    return type === AdminResourceType.SYSTEM
      ? t("system:resource.detail.typeSystem")
      : t("system:resource.detail.typeGeneral");
  };

  const parentFallback = t("system:resource.detail.parent.noneRoot");

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("system:resource.detail.sectionInfo")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Input id="name" label={t("system:resource.form.name.label")} type="text" value={resource.name} disabled />
          </div>

          <div>
            <Input id="key" label={t("system:resource.form.key.label")} type="text" value={resource.key} disabled />
          </div>

          <div>
            <Input id="code" label={t("system:resource.form.code.label")} type="text" value={resource.code} disabled />
          </div>

          <div>
            <Input
              id="path"
              label={t("system:resource.form.path.label")}
              type="text"
              value={resource.path || ""}
              disabled
            />
          </div>

          <div>
            <Input
              id="type"
              label={t("system:resource.form.type.label")}
              type="text"
              value={getTypeText(resource.type)}
              disabled
            />
          </div>

          <div>
            <Input
              id="icon"
              label={t("system:resource.form.icon.label")}
              type="text"
              value={resource.icon || ""}
              disabled
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t("system:resource.detail.sectionVisibility")}
          </div>
          <div className="flex items-center">
            <Checkbox
              id="is_visible"
              checked={!!resource.is_visible}
              disabled
              label={t("system:resource.form.checkboxVisible")}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("system:resource.detail.sectionParent")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              id="parent_name"
              label={t("system:resource.form.name.label")}
              type="text"
              value={resource.parent?.name || parentFallback}
              disabled
            />
          </div>
          <div>
            <Input
              id="parent_key"
              label={t("system:resource.form.key.label")}
              type="text"
              value={resource.parent?.key || parentFallback}
              disabled
            />
          </div>
        </div>
      </div>

      <div>
        <Input
          id="remark"
          label={t("system:resource.form.remark.label")}
          type="text"
          value={resource.remark || ""}
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t("system:resource.form.description.label")}
        </label>
        <TextArea id="description" value={resource.description || ""} disabled rows={3} />
      </div>
    </div>
  );
};

export default ResourceDetailView;
