import ContextMenu from "@/components/DataPage/ContextMenu";
import DataTableBody from "@/components/DataPage/DataTableBody";
import DataTableFooter from "@/components/DataPage/DataTableFooter";
import DataTableHeader from "@/components/DataPage/DataTableHeader";
import { CommonMenuButton } from "@/components/DataPage/MenuButtonTypes";
import { useContextMenu } from "@/components/DataPage/useContextMenu";
import { Table } from "@/components/ui/table";
import { usePermissions } from "@/context/AuthContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTablePagedData, DataTableProps, MenuButtonType } from "./types";

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  singleSelect = false,
  resource,
  rowActions,
  onRowContextMenu,
  onRowSelect,
  orderBy,
  descending = false,
  onSort,
  pagination,
  className,
  headerClassName,
  rowClassName,
  rowKey = "id",
  onClearSelectionRef,
  getReorderInfo,
  onReorder,
  defaultSelectedKeys = [],
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultSelectedKeys || []);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Permission check
  const { hasPermission } = usePermissions();

  // Context menu state
  const contextMenu = useContextMenu<T>();

  // Normalize data format: supports paged data or plain arrays
  const pagedData: DataTablePagedData<T> = Array.isArray(data) ? { page: 1, pageSize: data.length, total: data.length, items: data } : data;

  const { items, total, page, pageSize } = pagedData;

  // Helper to resolve rowKey
  const getRowKeyValue = useCallback(
    (row: T): string => {
      return typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
    },
    [rowKey],
  );

  // Track previous defaultSelectedKeys with ref; sync only when actually changed
  const prevDefaultSelectedKeysRef = useRef<string[]>(defaultSelectedKeys || []);
  const isInitialMountRef = useRef(true);

  // Compute keys that should be selected on current page
  const keysToSelect = useMemo(() => {
    if (!defaultSelectedKeys || defaultSelectedKeys.length === 0 || items.length === 0) {
      return [];
    }
    return defaultSelectedKeys.filter((key) => {
      return items.some((row) => {
        const rowKeyValue = getRowKeyValue(row);
        return rowKeyValue === key;
      });
    });
  }, [defaultSelectedKeys, items, getRowKeyValue]);

  // Sync selection only when defaultSelectedKeys actually changes
  useEffect(() => {
    const prevKeys = prevDefaultSelectedKeysRef.current;
    const currentKeys = defaultSelectedKeys || [];

    // Check whether defaultSelectedKeys actually changed
    const keysChanged =
      prevKeys.length !== currentKeys.length ||
      !prevKeys.every((key) => currentKeys.includes(key)) ||
      !currentKeys.every((key) => prevKeys.includes(key));

    // Sync only when:
    // 1. first mount
    // 2. defaultSelectedKeys actually changed
    if (isInitialMountRef.current || keysChanged) {
      if (keysToSelect.length > 0) {
        // Find matching row data
        const rowsToSelect = items.filter((row) => {
          const rowKeyValue = getRowKeyValue(row);
          return keysToSelect.includes(rowKeyValue);
        });

        setSelectedRows(rowsToSelect);
        setSelectedKeys(keysToSelect);
        // Notify parent of selection change
        onRowSelect?.(rowsToSelect, keysToSelect);
      } else if (isInitialMountRef.current && currentKeys.length === 0) {
        // Clear selection only on first mount when defaultSelectedKeys is empty
        setSelectedRows([]);
        setSelectedKeys([]);
        onRowSelect?.([], []);
      }

      // Update ref
      prevDefaultSelectedKeysRef.current = currentKeys;
      isInitialMountRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysToSelect.join(","), defaultSelectedKeys?.join(",") || ""]);

  // Handle row selection
  const handleRowSelect = (row: T, checked: boolean) => {
    const key = typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
    let newSelectedRows: T[] = [];
    let newSelectedKeys: string[] = [];

    if (singleSelect) {
      if (checked) {
        newSelectedRows = [row];
        newSelectedKeys = [key];
      } else {
        newSelectedRows = [];
        newSelectedKeys = [];
      }
    } else {
      if (checked) {
        newSelectedRows = [...selectedRows, row];
        newSelectedKeys = [...selectedKeys, key];
      } else {
        newSelectedRows = selectedRows.filter((r) => {
          const rKey = typeof rowKey === "function" ? rowKey(r) : String(r[rowKey]);
          return rKey !== key;
        });
        newSelectedKeys = selectedKeys.filter((k) => k !== key);
      }
    }

    setSelectedRows(newSelectedRows);
    setSelectedKeys(newSelectedKeys);
    onRowSelect?.(newSelectedRows, newSelectedKeys);
  };

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRows([]);
    setSelectedKeys([]);
    onRowSelect?.([], []);
  }, [onRowSelect]);

  // Expose clearSelection to parent component
  useEffect(() => {
    if (onClearSelectionRef) {
      onClearSelectionRef(clearSelection);
    }
  }, [onClearSelectionRef, clearSelection]);

  // Handle select-all
  const handleSelectAll = (checked: boolean) => {
    // Select-all is not supported in single-select mode
    if (singleSelect) return;

    let newSelectedRows: T[] = [];
    let newSelectedKeys: string[] = [];

    if (checked) {
      newSelectedRows = [...items];
      newSelectedKeys = items.map((row) => {
        const key = typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
        return key;
      });
    }

    setSelectedRows(newSelectedRows);
    setSelectedKeys(newSelectedKeys);
    onRowSelect?.(newSelectedRows, newSelectedKeys);
  };

  // Handle sorting with three-state cycle: none -> asc -> desc -> none
  const handleSort = (columnKey: string) => {
    if (onSort) {
      if (orderBy !== columnKey) {
        // Switch to a new column, start with ascending
        onSort(columnKey, false);
      } else {
        // Same column, cycle through three states
        if (!descending) {
          // Ascending -> descending
          onSort(columnKey, true);
        } else {
          // Descending -> unsorted (pass null to clear sort)
          onSort(null, false);
        }
      }
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    pagination?.onPageChange(newPage);
  };

  const handleItemsPerPageChange = (newPageSize: number) => {
    pagination?.onItemsPerPageChange?.(newPageSize);
  };

  // Check row-action permission
  const checkRowActionPermission = (action: MenuButtonType<T>): boolean => {
    // If no permission is set, allow display
    // If no resource is provided, allow display for backward compatibility
    if (!action.permission || !resource) {
      return true;
    }

    // Determine whether permission is a full permission code (contains ':')
    // If full code (e.g. "system:role:modify"), use directly
    // If verb only (e.g. "modify"), combine with resource as resource:verb
    const permissionCode = action.permission.includes(":") ? action.permission : `${resource}:${action.permission}`;

    // Check permission
    return hasPermission(permissionCode);
  };

  // Handle context menu
  const handleRowContextMenu = (row: T, index: number, event: React.MouseEvent) => {
    event.preventDefault();

    // Run custom context-menu handler first if provided
    if (onRowContextMenu) {
      onRowContextMenu(row, index, event);
      return;
    }

    // Build context-menu buttons
    const contextMenuButtons: MenuButtonType<T>[] = [];

    // If reorder is supported, add move options
    if (getReorderInfo && onReorder) {
      const reorderInfo = getReorderInfo(row, index);
      const rowId = typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
      const rowSequence = (row as { sequence?: number }).sequence ?? 0;

      // Debug info (development only)
      if (process.env.NODE_ENV === "development") {
        console.log("Reorder Info:", {
          index,
          canMoveUp: reorderInfo.canMoveUp,
          canMoveDown: reorderInfo.canMoveDown,
          prevItem: reorderInfo.prevItem,
          nextItem: reorderInfo.nextItem,
        });
      }

      // Move up: requires canMoveUp=true and prevItem
      if (reorderInfo.canMoveUp && reorderInfo.prevItem) {
        const prevItem = reorderInfo.prevItem;
        contextMenuButtons.push(
          CommonMenuButton.MOVE_UP(
            () => {
              onReorder(rowId, rowSequence, prevItem.id, prevItem.sequence);
              contextMenu.hideContextMenu();
            },
            {
              className: "",
            },
          ),
        );
      }

      // Move down: requires canMoveDown=true and nextItem
      if (reorderInfo.canMoveDown && reorderInfo.nextItem) {
        const nextItem = reorderInfo.nextItem;
        contextMenuButtons.push(
          CommonMenuButton.MOVE_DOWN(
            () => {
              onReorder(rowId, rowSequence, nextItem.id, nextItem.sequence);
              contextMenu.hideContextMenu();
            },
            {
              className: "",
            },
          ),
        );
      }

      // Add separator when move options and rowActions both exist
      if (contextMenuButtons.length > 0 && rowActions) {
        contextMenuButtons.push(CommonMenuButton.SEPARATOR());
      }
    }

    if (rowActions) {
      if (typeof rowActions === "function") {
        const actions = rowActions(row, index);
        contextMenuButtons.push(
          ...actions.filter((action) => {
            // Check visible flag first
            if (action.visible !== undefined) {
              const isVisible = typeof action.visible === "function" ? action.visible(row) : action.visible;
              if (!isVisible) return false;
            }
            // Then check permission
            return checkRowActionPermission(action);
          }),
        );
      } else {
        contextMenuButtons.push(
          ...rowActions.filter((action) => {
            // Check visible flag first
            if (action.visible !== undefined) {
              const isVisible = typeof action.visible === "function" ? action.visible(row) : action.visible;
              if (!isVisible) return false;
            }
            // Then check permission
            return checkRowActionPermission(action);
          }),
        );
      }
    }

    if (contextMenuButtons.length > 0) {
      contextMenu.showContextMenu(event, contextMenuButtons, row, index);
    }
  };

  // Expand/collapse
  const toggleExpand = (row: T) => {
    const key = typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={`h-full flex flex-col ${className || ""}`}>
      <div className="flex-auto min-h-0 max-w-full overflow-x-auto overflow-y-auto custom-scrollbar">
        <Table className="w-full">
          <DataTableHeader<T>
            columns={columns}
            singleSelect={singleSelect}
            orderBy={orderBy}
            descending={descending}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            selectedCount={selectedRows.length}
            totalCount={items.length}
            className={headerClassName}
          />
          <DataTableBody<T>
            data={items}
            columns={columns}
            singleSelect={singleSelect}
            selectedRows={selectedRows}
            selectedKeys={selectedKeys}
            onRowSelect={handleRowSelect}
            onRowContextMenu={handleRowContextMenu}
            rowKey={rowKey}
            rowClassName={rowClassName}
            loading={loading}
            emptyMessage={emptyMessage}
            expandedKeys={expandedKeys}
            onToggleExpand={toggleExpand}
          />
        </Table>
      </div>
      <DataTableFooter
        currentPage={page}
        totalPages={Math.ceil(total / pageSize)}
        rowsPerPage={pageSize}
        totalEntries={total}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleItemsPerPageChange}
        pageSizeOptions={pagination?.itemsPerPageOptions}
      />

      {/* Context menu */}
      {contextMenu.row !== undefined && contextMenu.index !== undefined && (
        <ContextMenu
          buttons={contextMenu.buttons}
          row={contextMenu.row}
          index={contextMenu.index}
          visible={contextMenu.visible}
          position={contextMenu.position}
          onClose={contextMenu.hideContextMenu}
        />
      )}
    </div>
  );
}
