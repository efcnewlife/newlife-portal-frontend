import { permissionService } from "@/api";
import { Checkbox, Input, TextArea } from "@efcnewlife/newlife-ui";
import type { PermissionDetail } from "@/types/api";
import { useEffect, useState } from "react";

interface PermissionDetailViewProps {
  permissionId: string;
}

const PermissionDetailView: React.FC<PermissionDetailViewProps> = ({ permissionId }) => {
  const [permissionData, setPermissionData] = useState<PermissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissionDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await permissionService.getById(permissionId);
        if (response.success) {
          setPermissionData(response.data);
        } else {
          setError(response.message || "Load failed");
        }
      } catch (e) {
        console.error("Error fetching permission detail:", e);
        setError("Failed to load permission details");
      } finally {
        setLoading(false);
      }
    };

    if (permissionId) {
      fetchPermissionDetail();
    }
  }, [permissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !permissionData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500 dark:text-red-400">{error || "Load failed"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input id="displayName" label="Display Name" type="text" value={permissionData.displayName} disabled />
        </div>

        <div>
          <Input id="code" label="Code" type="text" value={permissionData.code} disabled />
        </div>

        <div>
          <Input id="resource" label="Resource" type="text" value={permissionData.resource.name} disabled />
        </div>

        <div>
          <Input id="verb" label="Action" type="text" value={permissionData.verb.displayName} disabled />
        </div>
      </div>

      {/* Status */}
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Checkbox id="isActive" checked={permissionData.isActive} disabled label="Active" />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Details</label>
          <div className="space-y-2">
            <Input id="resourceKey" label="Key" type="text" value={permissionData.resource.key} disabled />
            <Input id="resourceCode" label="Code" type="text" value={permissionData.resource.code} disabled />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Details</label>
          <div className="space-y-2">
            <Input id="verbAction" label="Action" type="text" value={permissionData.verb.action} disabled />
          </div>
        </div>
      </div>

      {/* Description */}
      {permissionData.description && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <TextArea id="description" placeholder="" value={permissionData.description} disabled rows={3} />
        </div>
      )}

      {/* Remark */}
      {permissionData.remark && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remark</label>
          <TextArea id="remark" placeholder="" value={permissionData.remark} disabled rows={3} />
        </div>
      )}

      {/* Permission ID */}
      <div>
        <Input id="permissionId" label="Permission ID" type="text" value={permissionData.id} disabled />
      </div>
    </div>
  );
};

export default PermissionDetailView;
