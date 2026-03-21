import { PopoverPosition } from "@/const/enums";
import { useEffect, useState } from "react";

export interface RoleSearchFilters {
  keyword?: string;
  isActive?: boolean;
}

export default function RoleSearchPopover({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  trigger,
  isOpen,
  onOpenChange,
  popover,
}: {
  filters: RoleSearchFilters;
  onFiltersChange: (f: RoleSearchFilters) => void;
  onSearch: (f: RoleSearchFilters) => void;
  onClear: () => void;
  trigger: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  popover: { title: React.ReactNode; position?: PopoverPosition; width?: string };
}) {
  const [local, setLocal] = useState<RoleSearchFilters>(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  return (
    <div className="relative inline-block">
      {/* trigger */}
      <div onClick={() => onOpenChange(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-[420px] rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          style={{
            left: popover.position === PopoverPosition.BottomLeft ? 0 : undefined,
          }}
        >
          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{popover.title || "Search for roles"}</div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Keywords</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                placeholder="code or name"
                value={local.keyword || ""}
                onChange={(e) => setLocal((s) => ({ ...s, keyword: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4"
                checked={!!local.isActive}
                onChange={(e) => setLocal((s) => ({ ...s, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Show only enabled
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              onClick={() => {
                setLocal({});
                onClear();
              }}
            >
              Clear
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
              onClick={() => {
                onFiltersChange(local);
                onSearch(local);
              }}
            >
              search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
