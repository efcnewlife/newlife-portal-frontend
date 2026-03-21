import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ReactNode } from "react";

export interface PermissionSearchFilters {
  keyword?: string;
  isActive?: boolean;
}

interface PermissionSearchPopoverProps {
  filters: PermissionSearchFilters;
  onFiltersChange: (filters: PermissionSearchFilters) => void;
  onSearch: (filters: PermissionSearchFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const PermissionSearchPopover: React.FC<PermissionSearchPopoverProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}) => {
  const handleFilterChange = (key: keyof PermissionSearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleBooleanFilterChange = (key: keyof PermissionSearchFilters) => {
    const currentValue = filters[key];
    if (currentValue === true) {
      handleFilterChange(key, false);
    } else if (currentValue === false) {
      handleFilterChange(key, undefined);
    } else {
      handleFilterChange(key, true);
    }
  };

  const getBooleanLabel = (currentValue?: boolean, trueLabel = "yes", falseLabel = "no") => {
    if (currentValue === true) return trueLabel;
    if (currentValue === false) return falseLabel;
    return "No limit";
  };

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
        {/* keyword search */}
        <div>
          <Input
            id="keyword"
            label="keyword search"
            type="text"
            value={filters.keyword || ""}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            placeholder="Search display name or code"
            clearable
          />
        </div>

        {/* status filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">status filter</label>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Enabled status</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBooleanFilterChange("isActive")}
                className={`w-full justify-start text-xs ${
                  filters.isActive === true
                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300"
                    : filters.isActive === false
                    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300"
                    : ""
                }`}
              >
                {getBooleanLabel(filters.isActive, "Enabled", "Not enabled")}
              </Button>
            </div>
          </div>
        </div>

        {/* Filter abstracts */}
        {(filters.keyword || filters.isActive !== undefined) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.keyword && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Keywords: {filters.keyword}
                </span>
              )}
              {filters.isActive !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  enable: {getBooleanLabel(filters.isActive, "yes", "no")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SearchPopoverContent>
  );
};

export default PermissionSearchPopover;
