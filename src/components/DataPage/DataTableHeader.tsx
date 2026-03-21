import Checkbox from "@/components/ui/checkbox";
import { TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumn } from "./types";

interface DataTableHeaderProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Single-select mode */
  singleSelect?: boolean;
  /** Current sort column */
  orderBy?: string;
  /** Descending order */
  descending?: boolean;
  /** Sort event */
  onSort?: (columnKey: string) => void;
  /** Select-all event */
  onSelectAll?: (checked: boolean) => void;
  /** Selected count */
  selectedCount?: number;
  /** Total count */
  totalCount?: number;
  /** CSS class name */
  className?: string;
}

export default function DataTableHeader<T>({
  columns,
  singleSelect = false,
  orderBy,
  descending = false,
  onSort,
  onSelectAll,
  selectedCount = 0,
  totalCount = 0,
  className,
}: DataTableHeaderProps<T>) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const hasExpandColumn = columns.some((c) => typeof c.renderExpand === "function");

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const handleSort = (columnKey: string) => {
    onSort?.(columnKey);
  };

  const renderSortIcon = (columnKey: string) => {
    const isActive = orderBy === columnKey;

    return (
      <div className="flex flex-col gap-0.5">
        {/* Up arrow - ascending */}
        <svg
          className={isActive && !descending ? "text-brand-500" : "text-gray-300 dark:text-gray-700"}
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
            fill="currentColor"
          />
        </svg>
        {/* Down arrow - descending */}
        <svg
          className={isActive && descending ? "text-brand-500" : "text-gray-300 dark:text-gray-700"}
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  };

  return (
    <TableHeader className={className}>
      <TableRow className="border-l border-b border-gray-100 dark:border-white/[0.05] sticky top-0 bg-white dark:bg-gray-900 z-10">
        {/* Selection column */}
        {!singleSelect && onSelectAll && (
          <TableCell isHeader className="px-2 py-3 w-12">
            <div className="flex items-center justify-center">
              <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
            </div>
          </TableCell>
        )}

        {/* Dynamic columns */}
        {columns.map((column, columnIndex) => {
          if (column.visible === false) return null;

          const firstColumn = columnIndex === 0 && singleSelect ? "pl-8" : "";
          const isSortable = column.sortable && onSort;
          const sortKey = column.orderBy ?? column.key;
          const isActive = orderBy === sortKey;
          const isLastColumn = columnIndex === columns.filter((c) => c.visible !== false).length - 1;
          const shouldShowExpandHeader = hasExpandColumn && isLastColumn;

          // Build alignment-related Tailwind CSS class names
          const alignClass = column.align === "center" ? "text-center" : column.align === "end" ? "text-right" : "text-left";

          return (
            <TableCell
              key={column.key}
              isHeader
              className={`${firstColumn} px-4 py-3 border-b border-gray-100 dark:border-white/[0.05] ${column.width || ""} ${
                column.className || ""
              }`}
            >
              <div
                className={`flex items-center justify-between ${isSortable ? "cursor-pointer" : ""}`}
                onClick={() => isSortable && handleSort(sortKey)}
              >
                <span
                  className={`font-medium text-gray-700 text-theme-xs dark:text-gray-400 ${alignClass} ${isActive ? "text-brand-500" : ""}`}
                >
                  {column.label}
                </span>
                <div className="flex items-center gap-2">
                  {isSortable && renderSortIcon(sortKey)}
                  {shouldShowExpandHeader && (
                    <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                      {/* Reserved space for expand icon */}
                    </span>
                  )}
                </div>
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
