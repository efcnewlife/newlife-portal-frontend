import { resourceService } from "@/api";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";
import TextArea from "@/components/ui/textarea";
import { AdminResourceType } from "@/const/resource";
import type { ResourceMenuItem } from "@/types/resource-admin";
import { useEffect, useState } from "react";

interface ResourceDetailViewProps {
  resourceId: string;
}

const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({ resourceId }) => {
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
          setError(response.message || "Failed to load resource details");
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (resourceId) {
      fetchResource();
    }
  }, [resourceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
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
        <p className="text-gray-500 dark:text-gray-400">Resource not found</p>
      </div>
    );
  }

  const getTypeText = (type: AdminResourceType) => {
    return type === AdminResourceType.SYSTEM ? "System Feature" : "General Feature";
  };

  return (
    <div className="space-y-8">
      {/* Basic Information & Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Resource Information</h3>

      {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Input id="name" label="Name" type="text" value={resource.name} disabled />
          </div>

          <div>
            <Input id="key" label="Key" type="text" value={resource.key} disabled />
          </div>

          <div>
            <Input id="code" label="Code" type="text" value={resource.code} disabled />
          </div>

          <div>
            <Input id="path" label="Path" type="text" value={resource.path || ""} disabled />
          </div>

          <div>
            <Input id="type" label="Type" type="text" value={getTypeText(resource.type)} disabled />
          </div>

          <div>
            <Input id="icon" label="Icon" type="text" value={resource.icon || ""} disabled />
          </div>
        </div>

      {/* Status */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Status</div>
          <div className="flex items-center">
            <Checkbox id="is_visible" checked={!!resource.is_visible} disabled label="Visible" />
          </div>
        </div>
      </div>

      {/* Parent Resource Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Parent Resource Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input id="parent_name" label="Name" type="text" value={resource.parent?.name || "None (root resource)"} disabled />
          </div>
          <div>
            <Input id="parent_key" label="Key" type="text" value={resource.parent?.key || "None (root resource)"} disabled />
          </div>
        </div>
      </div>

      {/* Remark */}
      <div>
        <Input id="remark" label="Remark" type="text" value={resource.remark || ""} disabled />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <TextArea id="description" value={resource.description || ""} disabled rows={3} />
      </div>
    </div>
  );
};

export default ResourceDetailView;
