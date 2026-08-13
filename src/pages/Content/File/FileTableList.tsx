import { cn } from "@/utils";
import { DateUtil } from "@/utils/dateUtil";
import { Checkbox } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { MdDelete, MdDescription, MdOpenInNew } from "react-icons/md";
import type { FileItem } from "./types";
import { formatBytes, getFileIconTone } from "./utils";

interface FileTableListProps {
  files: FileItem[];
  selectedKeys: string[];
  onSelect: (fileId: string, checked: boolean) => void;
  onDeleteOne?: (fileId: string) => void;
}

const FileTableList = ({ files, selectedKeys, onSelect, onDeleteOne }: FileTableListProps) => {
  const { t } = useTranslation("content");

  if (files.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl bg-white dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("file.browse.emptyFiles")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 w-10" />
            <th className="px-4 py-3">{t("file.table.name")}</th>
            <th className="px-4 py-3">{t("file.table.category")}</th>
            <th className="px-4 py-3">{t("file.table.size")}</th>
            <th className="px-4 py-3">{t("file.table.dateModified")}</th>
            <th className="px-4 py-3 text-right">{t("file.table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
          {files.map((file) => {
            const isSelected = selectedKeys.includes(file.id);
            const iconTone = getFileIconTone(file.extension);
            return (
              <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Checkbox checked={isSelected} onChange={() => onSelect(file.id, !isSelected)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconTone)}>
                      <MdDescription className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white/90" title={file.name}>
                        {file.name}
                      </p>
                      {file.extension && <p className="text-xs uppercase text-gray-500 dark:text-gray-400">{file.extension}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t("file.category.files")}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{file.size !== undefined ? formatBytes(file.size) : "-"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{file.createdAt ? DateUtil.format(file.createdAt) : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                        aria-label={t("file.table.preview")}
                      >
                        <MdOpenInNew className="size-4" />
                      </a>
                    )}
                    {onDeleteOne && (
                      <button
                        type="button"
                        onClick={() => onDeleteOne(file.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        aria-label={t("file.table.deleteOne")}
                      >
                        <MdDelete className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileTableList;
