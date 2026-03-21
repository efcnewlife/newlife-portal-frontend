import { Checkbox, Spinner, TableBody, TableCell, TableRow, Tooltip } from "@efcnewlife/newlife-ui";
import { Fragment } from "react";
import { DataTableColumn } from "./types";

interface DataTableBodyProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Single-select mode */
  singleSelect?: boolean;
  /** Selected rows */
  selectedRows: T[];
  /** Selected keys */
  selectedKeys: string[];
  /** Row selection event */
  onRowSelect: (row: T, checked: boolean) => void;
  /** Context menu event */
  onRowContextMenu?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Row key */
  rowKey?: keyof T | ((row: T) => string);
  /** Row CSS class name */
  rowClassName?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty-data message */
  emptyMessage?: string;
  /** Expanded key set */
  expandedKeys?: Set<string>;
  /** Toggle expand */
  onToggleExpand?: (row: T) => void;
}

export default function DataTableBody<T extends Record<string, unknown>>({
  data,
  columns,
  singleSelect = false,
  selectedKeys,
  onRowSelect,
  onRowContextMenu,
  rowKey = "id",
  rowClassName,
  loading = false,
  emptyMessage = "No data available",
  expandedKeys,
  onToggleExpand,
}: DataTableBodyProps<T>) {
  const getRowKey = (row: T): string => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  const isRowSelected = (row: T): boolean => {
    const key = getRowKey(row);
    return selectedKeys.includes(key);
  };

  const handleRowSelect = (row: T, checked: boolean) => {
    onRowSelect(row, checked);
  };

  const renderCellValue = (column: DataTableColumn<T>, row: T, index: number) => {
    const value = row[column.key];

    // Use custom render function
    if (column.render) {
      return column.render(value, row, index);
    }

    // Render with valueEnum
    if (column.valueEnum) {
      const enumItem = column.valueEnum.item(value);
      if (enumItem) {
        return (
          <div className="flex items-center gap-2">
            {enumItem.icon}
            <span className={enumItem.color || ""}>{enumItem.text}</span>
          </div>
        );
      }
    }

    // Default rendering + copyable behavior
    const displayValue = String(value ?? "");
    if (column.copyable) {
      return (
        <Tooltip content="Click to copy" wrapContent={false}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(displayValue).catch(() => {});
            }}
            className="w-full text-left cursor-copy hover:text-gray-800 dark:hover:text-white/90"
            aria-label="Click to copy"
          >
            <span className="truncate">{displayValue}</span>
          </button>
        </Tooltip>
      );
    }

    return <span>{displayValue}</span>;
  };

  const renderTooltip = (column: DataTableColumn<T>, row: T, index: number) => {
    if (!column.tooltip) return null;

    const tooltipText =
      typeof column.tooltip === "string"
        ? column.tooltip
        : typeof column.tooltip === "function"
          ? column.tooltip(row)
          : String(row[column.key] || "");

    if (tooltipText === undefined || tooltipText === null || tooltipText === "") {
      return renderCellValue(column, row, index);
    }
    const wrapContent = column.tooltipWrapContent !== undefined ? column.tooltipWrapContent : true;

    return (
      <Tooltip
        content={tooltipText}
        wrapContent={wrapContent}
        className={column.tooltipWidth || ""}
        contentClassName={column.tooltipWidth || ""}
        placement="bottom"
      >
        <span className="cursor-help truncate block">{renderCellValue(column, row, index)}</span>
      </Tooltip>
    );
  };

  if (loading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="px-4 py-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Spinner size="md" color="primary" showText />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (data.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {data.map((row, index) => {
        const key = getRowKey(row);
        const isSelected = isRowSelected(row);
        const hasExpandColumn = columns.some((c) => typeof c.renderExpand === "function");
        const isExpanded = expandedKeys?.has(key);

        return (
          <Fragment key={key}>
            <TableRow
              className={`border-l border-b border-gray-100 dark:border-white/[0.05] ${rowClassName}`}
              onContextMenu={(e: React.MouseEvent<HTMLTableRowElement>) => onRowContextMenu?.(row, index, e)}
            >
              {/* Selection column */}
              {!singleSelect && (
                <TableCell className="px-2 py-4 dark:text-white/90 whitespace-nowrap w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox checked={isSelected} onChange={(checked) => handleRowSelect(row, checked)} />
                  </div>
                </TableCell>
              )}

              {/* Dynamic columns */}
              {columns.map((column, columnIndex) => {
                if (column.visible === false) return null;

                const firstColumn = columnIndex === 0 && singleSelect ? "pl-8" : "";
                const isLastColumn = columnIndex === columns.filter((c) => c.visible !== false).length - 1;
                const shouldShowExpandButton = hasExpandColumn && isLastColumn;

                // Build alignment-related Tailwind CSS class names
                const alignClass = column.align === "center" ? "text-center" : column.align === "end" ? "text-right" : "text-left";

                // Build cursor-related Tailwind CSS class names
                const cursorClass = column.onClick ? "cursor-pointer" : "cursor-default";

                return (
                  <TableCell
                    key={column.key}
                    className={`${firstColumn} px-4 py-4 font-normal text-gray-800 text-theme-sm dark:text-white/90 ${
                      column.overflow ? "" : "whitespace-nowrap"
                    } ${column.width || ""} ${alignClass} ${cursorClass} ${column.className || ""}`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex-1 min-w-0 w-full">
                        {column.copyable
                          ? renderCellValue(column, row, index)
                          : column.tooltip
                            ? renderTooltip(column, row, index)
                            : renderCellValue(column, row, index)}
                      </div>
                      {shouldShowExpandButton && (
                        <button
                          className="flex-shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand?.(row);
                          }}
                          aria-expanded={!!isExpanded}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M7 5l5 5-5 5V5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>

            {hasExpandColumn && isExpanded && (
              <TableRow>
                <TableCell
                  colSpan={1 + (hasExpandColumn ? 1 : 0) + columns.filter((c) => c.visible !== false).length}
                  className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                >
                  {columns.find((c) => typeof c.renderExpand === "function")?.renderExpand?.(row)}
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        );
      })}
    </TableBody>
  );
}
