import type { MinistryListItem } from "@/api/services/ministryService";
import { cn } from "@/utils";
import { DateUtil } from "@/utils/dateUtil";
import { Badge } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";
import { ministryStatusBadgeColor } from "./ministryStatusBadge";
import { STEWARD_DIRECTORY_SORT_FIELDS, type StewardDirectorySortField, type StewardDirectorySortState } from "./stewardDirectorySort";

interface StewardDirectoryRailProps {
  items: MinistryListItem[];
  selectedId: string | null;
  loading: boolean;
  width: number;
  sort: StewardDirectorySortState;
  onSortFieldClick: (field: StewardDirectorySortField) => void;
  onSelect: (ministryId: string) => void;
}

const sortFieldLabelKey = (field: StewardDirectorySortField): string => {
  switch (field) {
    case "name":
      return "ministryMember.sort.fieldName";
    case "created_at":
      return "ministryMember.sort.fieldCreated";
    case "updated_at":
    default:
      return "ministryMember.sort.fieldUpdated";
  }
};

const StewardDirectoryRail = ({ items, selectedId, loading, width, sort, onSortFieldClick, onSelect }: StewardDirectoryRailProps) => {
  const { t } = useTranslation("ministry");

  return (
    <aside className="shrink-0 flex flex-col" style={{ width }}>
      <div className="shrink-0 flex items-center gap-1 px-2 py-2 border-b border-gray-100 dark:border-white/[0.05]">
        {STEWARD_DIRECTORY_SORT_FIELDS.map((field) => {
          const isActive = sort.field === field;
          return (
            <button
              key={field}
              type="button"
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]",
              )}
              aria-pressed={isActive}
              aria-label={t("ministryMember.sort.toggleAria", {
                field: t(sortFieldLabelKey(field)),
                direction: isActive
                  ? sort.descending
                    ? t("ministryMember.sort.descending")
                    : t("ministryMember.sort.ascending")
                  : t("ministryMember.sort.inactive"),
              })}
              onClick={() => onSortFieldClick(field)}
            >
              <span>{t(sortFieldLabelKey(field))}</span>
              {isActive ? (
                sort.descending ? (
                  <MdArrowDownward className="size-3.5" aria-hidden />
                ) : (
                  <MdArrowUpward className="size-3.5" aria-hidden />
                )
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-2 text-sm text-gray-500">{t("common:loading", { ns: "common", defaultValue: "Loading..." })}</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-500">{t("ministryMember.emptyRail")}</p>
        ) : (
          <ul>
            {items.map((item) => {
              const updatedLabel = item.updateAt ? DateUtil.friendlyDate(item.updateAt) : "";
              const updatedTitle = item.updateAt ? DateUtil.format(item.updateAt) : undefined;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm border-b border-gray-50 dark:border-white/[0.04]",
                      selectedId === item.id
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                        : "text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/[0.04]",
                    )}
                    onClick={() => onSelect(item.id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">{item.name || item.id}</span>
                      <span className="shrink-0">
                        <Badge variant="light" size="sm" color={ministryStatusBadgeColor(item.status)}>
                          {t(`ministry.status.${item.status}`, { defaultValue: item.status })}
                        </Badge>
                      </span>
                    </span>
                    {updatedLabel ? (
                      <span
                        className={cn(
                          "mt-1 block text-xs",
                          selectedId === item.id ? "text-brand-500/80 dark:text-brand-400/80" : "text-gray-500 dark:text-gray-400",
                        )}
                        title={updatedTitle}
                      >
                        {t("ministryMember.updated", { time: updatedLabel })}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default StewardDirectoryRail;
