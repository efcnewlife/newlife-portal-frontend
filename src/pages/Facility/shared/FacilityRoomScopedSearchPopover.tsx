import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import { Input, Select } from "@efcnewlife/newlife-ui";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRoomListOptions } from "./useRoomListOptions";

export interface FacilityRoomScopedSearchFilters {
  keyword?: string;
  facilityId?: string;
}

interface FacilityRoomScopedSearchPopoverProps {
  filters: FacilityRoomScopedSearchFilters;
  onFiltersChange: (filters: FacilityRoomScopedSearchFilters) => void;
  onSearch: (filters: FacilityRoomScopedSearchFilters) => void;
  onClear: () => void;
  keywordLabel: string;
  keywordPlaceholder: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const FacilityRoomScopedSearchPopover = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  keywordLabel,
  keywordPlaceholder,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}: FacilityRoomScopedSearchPopoverProps) => {
  const { t } = useTranslation("facility");
  const { roomOptions, roomLabelById } = useRoomListOptions();

  const handleFilterChange = (key: keyof FacilityRoomScopedSearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Boolean(filters.keyword?.trim() || filters.facilityId);

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
          id="facility-room-scoped-keyword"
          label={keywordLabel}
          type="text"
          value={filters.keyword || ""}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          placeholder={keywordPlaceholder}
          clearable
        />
        <Select
          id="facility-room-scoped-room"
          label={t("shared.selectRoom")}
          options={roomOptions}
          value={filters.facilityId || ""}
          onChange={(value) =>
            handleFilterChange("facilityId", value && String(value) !== "" ? String(value) : undefined)
          }
          clearable
        />
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("shared.searchChipsTitle")}</div>
            <div className="flex flex-wrap gap-1">
              {filters.keyword?.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {t("shared.searchChipKeyword")} {filters.keyword.trim()}
                </span>
              )}
              {filters.facilityId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {t("shared.searchChipRoom")} {roomLabelById.get(filters.facilityId) || filters.facilityId}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SearchPopoverContent>
  );
};

export default FacilityRoomScopedSearchPopover;
