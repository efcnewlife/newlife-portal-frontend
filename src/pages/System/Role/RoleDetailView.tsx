import { Table, TableBody, TableCell, TableHeader, TableRow } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

export interface RoleDetailProps {
  role: {
    id: string;
    code: string;
    name?: string;
    isActive: boolean;
    description?: string;
    remark?: string;
    createAt?: string;
    updateAt?: string;
    permissions?: Array<{ id: string; resourceName: string; name: string; code: string }>;
  };
}

export default function RoleDetailView({ role }: RoleDetailProps) {
  const { t } = useTranslation();
  const dash = t("common:none");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem
          label={t("system:role.detail.labelCode")}
          value={<code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{role.code}</code>}
        />
        <DetailItem label={t("system:role.detail.labelName")} value={role.name || dash} />
        <DetailItem
          label={t("system:role.detail.labelActive")}
          value={role.isActive ? t("system:role.boolean.yes") : t("system:role.boolean.no")}
        />
        <DetailItem label={t("system:role.detail.labelCreatedAt")} value={role.createAt || dash} />
        <DetailItem label={t("system:role.detail.labelUpdatedAt")} value={role.updateAt || dash} />
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("system:role.detail.descriptionHeading")}
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300 min-h-10">
          {role.description || dash}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("system:role.detail.remarkHeading")}
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300 min-h-10">
          {role.remark || dash}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t("system:role.detail.permissionsHeadingCount", { count: role.permissions?.length || 0 })}
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(role.permissions || []).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("system:role.detail.permissionsEmpty")}
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-white/[0.05] sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-start"
                    >
                      {t("system:role.detail.table.resourceName")}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-start"
                    >
                      {t("system:role.detail.table.displayName")}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-start"
                    >
                      {t("system:role.detail.table.permissionCode")}
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(role.permissions || [])]
                    .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
                    .map((p) => (
                      <TableRow
                        key={p.id}
                        className="border-b border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.resourceName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{p.name}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200">
                            {p.code}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm text-gray-800 dark:text-gray-200">{value}</div>
    </div>
  );
}
