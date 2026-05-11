import { roleService, type RoleBase } from "@/api/services/roleService";
import { userService } from "@/api/services/userService";
import { Button, Checkbox } from "@efcnewlife/newlife-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface UserBindRoleFormProps {
  userId: string;
  initialRoleIds?: string[];
  onSubmit: (roleIds: string[]) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const UserBindRoleForm: React.FC<UserBindRoleFormProps> = ({ userId, initialRoleIds = [], onSubmit, onCancel, submitting = false }) => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleBase[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoleIds);
  const [loading, setLoading] = useState(false);

  // Load roles and current user roles when userId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch role list and user roles in parallel
        const [rolesResponse, userRolesResponse] = await Promise.all([roleService.getList(), userService.getUserRoles(userId)]);

        if (rolesResponse.data?.items) {
          setRoles(rolesResponse.data.items);
        }

        // Initial selection: prefer props; otherwise use API response
        const roleIdsToUse = initialRoleIds.length > 0 ? initialRoleIds : userRolesResponse.data?.role_ids || [];
        setSelectedRoleIds(roleIdsToUse);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        alert(t("system:user.bindRoles.loadAlert"));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sync selection when initialRoleIds changes (non-empty only)
  useEffect(() => {
    if (initialRoleIds.length > 0) {
      setSelectedRoleIds(initialRoleIds);
    }
  }, [initialRoleIds]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(roles.map((role) => role.id));
    } else {
      setSelectedRoleIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedRoleIds);
  };

  const allSelected = roles.length > 0 && selectedRoleIds.length === roles.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
          <Checkbox
            id="select-all"
            label={t("system:user.bindRoles.selectAll")}
            checked={allSelected}
            onChange={handleSelectAll}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("system:user.bindRoles.summary", { selected: selectedRoleIds.length, total: roles.length })}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t("system:shared.loading")}</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t("system:user.bindRoles.noRoles")}</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {roles.map((role) => (
              <Checkbox
                key={role.id}
                id={`role-${role.id}`}
                label={role.name ? `${role.name} (${role.code})` : role.code}
                checked={selectedRoleIds.includes(role.id)}
                onChange={(checked) => handleRoleToggle(role.id, checked)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onCancel} size="sm" variant="outline" disabled={submitting || loading}>
          {t("common:cancel")}
        </Button>
        <Button btnType="submit" size="sm" variant="primary" disabled={submitting || loading}>
          {submitting ? t("system:user.bindRoles.submittingLabel") : t("system:user.bindRoles.confirmBind")}
        </Button>
      </div>
    </form>
  );
};

export default UserBindRoleForm;
