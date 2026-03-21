import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import { Button, Input, Select } from "newlife-ui";
import { Gender } from "@/const/enums";
import { ReactNode } from "react";

export interface UserSearchFilters {
  keyword?: string;
  verified?: boolean;
  is_active?: boolean;
  is_admin?: boolean;
  is_superuser?: boolean;
  gender?: Gender;
}

interface UserSearchPopoverProps {
  filters: UserSearchFilters;
  onFiltersChange: (filters: UserSearchFilters) => void;
  onSearch: (filters: UserSearchFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const UserSearchPopover: React.FC<UserSearchPopoverProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}) => {
  const handleFilterChange = (key: keyof UserSearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleBooleanFilterChange = (key: keyof UserSearchFilters) => {
    const currentValue = filters[key];
    if (currentValue === true) {
      handleFilterChange(key, false);
    } else if (currentValue === false) {
      handleFilterChange(key, undefined);
    } else {
      handleFilterChange(key, true);
    }
  };

  const getBooleanLabel = (currentValue?: boolean, trueLabel = "Yes", falseLabel = "No") => {
    if (currentValue === true) return trueLabel;
    if (currentValue === false) return falseLabel;
    return "Any";
  };

  const getGenderLabel = (gender?: Gender) => {
    switch (gender) {
      case Gender.Male:
        return "Male";
      case Gender.Female:
        return "Female";
      default:
        return "Any";
    }
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
        {/* Keyword Search */}
        <div>
          <Input
            id="keyword"
            label="Keyword"
            type="text"
            value={filters.keyword || ""}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            placeholder="Search by phone number, email, or display name"
            clearable
          />
        </div>

        {/* Status Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Filters</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Verification</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBooleanFilterChange("verified")}
                className={`w-full justify-start text-xs ${
                  filters.verified === true
                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300"
                    : filters.verified === false
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300"
                      : ""
                }`}
              >
                {getBooleanLabel(filters.verified, "Verified", "Unverified")}
              </Button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBooleanFilterChange("is_active")}
                className={`w-full justify-start text-xs ${
                  filters.is_active === true
                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300"
                    : filters.is_active === false
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300"
                      : ""
                }`}
              >
                {getBooleanLabel(filters.is_active, "Active", "Inactive")}
              </Button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Admin Access</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBooleanFilterChange("is_admin")}
                className={`w-full justify-start text-xs ${
                  filters.is_admin === true
                    ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300"
                    : filters.is_admin === false
                      ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                      : ""
                }`}
              >
                {getBooleanLabel(filters.is_admin, "Admin", "Regular User")}
              </Button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Superuser</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBooleanFilterChange("is_superuser")}
                className={`w-full justify-start text-xs ${
                  filters.is_superuser === true
                    ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300"
                    : filters.is_superuser === false
                      ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                      : ""
                }`}
              >
                {getBooleanLabel(filters.is_superuser, "Superuser", "Not Superuser")}
              </Button>
            </div>
          </div>
        </div>

        {/* Gender Filter */}
        <div>
          <Select
            id="gender"
            label="Gender"
            options={[
              { value: "", label: "Any" },
              { value: Gender.Male.toString(), label: "Male" },
              { value: Gender.Female.toString(), label: "Female" },
            ]}
            value={filters.gender?.toString() || ""}
            onChange={(value) => handleFilterChange("gender", value ? Number(value) : undefined)}
            placeholder="Select gender"
            clearable
            size="md"
          />
        </div>

        {/* Filter Summary */}
        {(filters.keyword ||
          filters.verified !== undefined ||
          filters.is_active !== undefined ||
          filters.is_admin !== undefined ||
          filters.is_superuser !== undefined ||
          filters.gender !== undefined) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.keyword && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Keyword: {filters.keyword}
                </span>
              )}
              {filters.verified !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Verified: {getBooleanLabel(filters.verified, "Yes", "No")}
                </span>
              )}
              {filters.is_active !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Active: {getBooleanLabel(filters.is_active, "Yes", "No")}
                </span>
              )}
              {filters.is_admin !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Admin: {getBooleanLabel(filters.is_admin, "Yes", "No")}
                </span>
              )}
              {filters.is_superuser !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Superuser: {getBooleanLabel(filters.is_superuser, "Yes", "No")}
                </span>
              )}
              {filters.gender !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                  Gender: {getGenderLabel(filters.gender)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SearchPopoverContent>
  );
};

export default UserSearchPopover;
