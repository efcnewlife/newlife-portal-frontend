import DataTable from "./DataTable";
import DataTableToolbar from "./DataTableToolbar";
import { DataTableColumn, DataTablePagedData, MenuButtonType, PageButtonType } from "./types";

interface DataPageProps<T extends Record<string, unknown>> {
  /** Table information */
  data: DataTablePagedData<T>;
  /** Field definition */
  columns: DataTableColumn<T>[];
  /** Loading status */
  loading?: boolean;
  /** Whether it is radio mode */
  singleSelect?: boolean;
  /** Current sort field (external control) */
  orderBy?: string;
  /** Whether to descend (external control) */
  descending?: boolean;
  /** Resource name (used for permission checks, e.g. "user"） */
  resource?: string;
  /** toolbar button */
  buttons?: PageButtonType[];
  /** Right click menu action */
  rowActions?: MenuButtonType<T>[] | ((row: T, index: number) => MenuButtonType<T>[]);
  /** Sort change event */
  onSort?: (columnKey: string | null, descending: boolean) => void;
  /** Row selection event */
  onRowSelect?: (selectedRows: T[], selectedKeys: string[]) => void;
  /** Pagination change event */
  onPageChange?: (page: number) => void;
  /** Number of items per page change event */
  onItemsPerPageChange?: (pageSize: number) => void;
  /** Container style class name */
  className?: string;
  /** Callback to clear selected state */
  onClearSelectionRef?: (clearFn: () => void) => void;
  /** Function to get reordering information */
  getReorderInfo?: (
    row: T,
    index: number
  ) => {
    canMoveUp: boolean;
    canMoveDown: boolean;
    prevItem?: { id: string; sequence: number };
    nextItem?: { id: string; sequence: number };
  };
  /** Reorder events */
  onReorder?: (currentId: string, currentSequence: number, targetId: string, targetSequence: number) => void;
  /** Default selected key value list */
  defaultSelectedKeys?: string[];
}

export default function DataPage<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  singleSelect = false,
  orderBy,
  descending,
  resource,
  buttons = [],
  rowActions,
  onSort,
  onRowSelect,
  onPageChange,
  onItemsPerPageChange,
  className,
  onClearSelectionRef,
  getReorderInfo,
  onReorder,
  defaultSelectedKeys,
}: DataPageProps<T>) {
  return (
    <div className={`h-full flex flex-col rounded-xl bg-white dark:bg-white/[0.03] ${className || ""}`}>
      <DataTableToolbar buttons={buttons} resource={resource} />
      <div className="flex-1 min-h-0">
        <DataTable<T>
          data={data}
          columns={columns}
          loading={loading}
          singleSelect={singleSelect}
          orderBy={orderBy}
          descending={descending}
          resource={resource}
          onSort={onSort}
          onRowSelect={onRowSelect}
          rowActions={rowActions}
          onClearSelectionRef={onClearSelectionRef}
          getReorderInfo={getReorderInfo}
          onReorder={onReorder}
          defaultSelectedKeys={defaultSelectedKeys}
          pagination={{
            onPageChange: onPageChange || (() => {}),
            onItemsPerPageChange: onItemsPerPageChange || (() => {}),
            itemsPerPageOptions: [5, 10, 20, 50],
          }}
        />
      </div>
    </div>
  );
}
