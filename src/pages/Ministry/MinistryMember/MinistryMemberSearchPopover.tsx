import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import type { MinistryListItem } from "@/api/services/ministryService";
import { Input, Select } from "@efcnewlife/newlife-ui";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface MinistryMemberSearchFilters {
  keyword?: string;
  ministryId?: string;
}

interface MinistryMemberSearchPopoverProps {
  filters: MinistryMemberSearchFilters;
  onFiltersChange: (filters: MinistryMemberSearchFilters) => void;
  onSearch: (filters: MinistryMemberSearchFilters) => void;
  onClear: () => void;
  ministries: MinistryListItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const MinistryMemberSearchPopover = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  ministries,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}: MinistryMemberSearchPopoverProps) => {
  const { t } = useTranslation("ministry");

  const handleFilterChange = (key: keyof MinistryMemberSearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const keyword = filters.keyword?.trim().toLowerCase() || "";

  const ministryOptions = useMemo(() => {
    const filtered = ministries.filter((ministry) => {
      if (!keyword) return true;
      const label = (ministry.name || ministry.id).toLowerCase();
      return label.includes(keyword);
    });
    return [
      { value: "", label: t("ministryMember.filter.selectMinistry") },
      ...filtered.map((ministry) => ({
        value: ministry.id,
        label: ministry.name || ministry.id,
      })),
    ];
  }, [keyword, ministries, t]);

  const ministryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ministry of ministries) {
      map.set(ministry.id, ministry.name || ministry.id);
    }
    return map;
  }, [ministries]);

  const hasActiveFilters = Boolean(filters.keyword?.trim() || filters.ministryId);

  return (
    <SearchPopoverContent
      onSearch={() => onSearch(filters)}
      onClear={onClear}
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      popover={popover}
    >
      <div className="space-y-4">
        <Input
          id="ministry-member-keyword"
          label={t("ministryMember.search.keywordLabel")}
          type="text"
          value={filters.keyword || ""}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          placeholder={t("ministryMember.search.keywordPlaceholder")}
          clearable
        />
        <Select
          id="ministry-member-ministry"
          label={t("ministryMember.filter.ministry")}
          options={ministryOptions}
          value={filters.ministryId || ""}
          onChange={(value) =>
            handleFilterChange("ministryId", value && String(value) !== "" ? String(value) : undefined)
          }
          clearable
        />
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("ministryMember.search.chipsTitle")}</div>
            <div className="flex flex-wrap gap-1">
              {filters.keyword?.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {t("ministryMember.search.chipKeyword")} {filters.keyword.trim()}
                </span>
              )}
              {filters.ministryId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {t("ministryMember.search.chipMinistry")}{" "}
                  {ministryLabelById.get(filters.ministryId) || filters.ministryId}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SearchPopoverContent>
  );
};

export default MinistryMemberSearchPopover;
