import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import { Input } from "@efcnewlife/newlife-ui";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface SettingSearchFilters {
  namespace?: string;
}

interface SettingSearchPopoverProps {
  filters: SettingSearchFilters;
  onFiltersChange: (filters: SettingSearchFilters) => void;
  onSearch: (filters: SettingSearchFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const SettingSearchPopover: React.FC<SettingSearchPopoverProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}) => {
  const { t } = useTranslation();

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
          id="setting-search-namespace"
          label={t("system:setting.search.namespaceLabel")}
          type="text"
          value={filters.namespace || ""}
          onChange={(e) => onFiltersChange({ ...filters, namespace: e.target.value })}
          placeholder={t("system:setting.search.namespacePlaceholder")}
          clearable
        />

        {filters.namespace ? (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("system:setting.search.chipsTitle")}</div>
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {t("system:setting.search.chipNamespacePrefix")} {filters.namespace}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </SearchPopoverContent>
  );
};

export default SettingSearchPopover;
