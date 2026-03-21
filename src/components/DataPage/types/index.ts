import { PopoverPosition } from "@/const/enums";
import { ReactNode } from "react";

/**
 * Column definition interface
 */
export interface DataTableColumn<T> {
  /** Column key */
  key: string;
  /** Column label */
  label: string;
  /** Sortable */
  sortable?: boolean;
  /** Field name sent to API for sorting; defaults to key */
  orderBy?: string;
  /** Custom render function */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Column CSS class name */
  className?: string | string[];
  /** Column width (Tailwind CSS class, e.g. "w-32", "w-1/4", "w-[100px]") */
  width?: string;
  /** Alignment */
  align?: "start" | "center" | "end";
  /** Visible */
  visible?: boolean;
  /** Copyable */
  copyable?: boolean;
  /** Allow overflow */
  overflow?: boolean;
  /** Tooltip text */
  tooltip?: boolean | string | ((row: T) => string);
  /** Tooltip width (Tailwind CSS class, e.g. "w-32", "w-1/4", "w-[100px]") */
  tooltipWidth?: string;
  /** Wrap tooltip content */
  tooltipWrapContent?: boolean;
  /** Value enum config */
  valueEnum?: {
    item: (value: unknown) => {
      text: string;
      color?: string;
      icon?: ReactNode;
      loading?: boolean;
      tooltip?: string;
    } | null;
  };
  /** Expand render */
  renderExpand?: (row: T) => ReactNode;
  /** Click event */
  onClick?: (row: T, index: number) => void;
}

/**
 * Paginated data structure
 */
export interface DataTablePagedData<T> {
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total count */
  total: number;
  /** Data items */
  items: T[];
}

/**
 * DataTable component props
 */
export interface DataTableProps<T> {
  /** Data source */
  data: DataTablePagedData<T> | T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Actionable */
  actionable?: boolean;
  /** Single-select mode */
  singleSelect?: boolean;
  /** Resource name (for permission checks) */
  resource?: string;
  /** Row context-menu actions */
  rowActions?: MenuButtonType<T>[] | ((row: T, index: number) => MenuButtonType<T>[]);
  /** Context-menu trigger event */
  onRowContextMenu?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Row selection event */
  onRowSelect?: (selectedRows: T[], selectedKeys: string[]) => void;
  /** Sort column */
  orderBy?: string;
  /** Descending order */
  descending?: boolean;
  /** Sort event */
  onSort?: (orderBy: string | null, descending: boolean) => void;
  /** Pagination config */
  pagination?: {
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (n: number) => void;
    itemsPerPageOptions?: number[];
  };
  /** CSS class name */
  className?: string;
  /** Header CSS class name */
  headerClassName?: string;
  /** Row CSS class name */
  rowClassName?: string;
  /** Row key */
  rowKey?: keyof T | ((row: T) => string);
  /** Callback for clearing selection */
  onClearSelectionRef?: (clearFn: () => void) => void;
  /** Function to get reorder info */
  getReorderInfo?: (
    row: T,
    index: number,
  ) => {
    canMoveUp: boolean;
    canMoveDown: boolean;
    prevItem?: { id: string; sequence: number };
    nextItem?: { id: string; sequence: number };
  };
  /** Reorder event */
  onReorder?: (currentId: string, currentSequence: number, targetId: string, targetSequence: number) => void;
  /** Default selected key list */
  defaultSelectedKeys?: string[];
}

/**
 * DataTablePage internal state
 */
export interface DataTablePageInternalState {
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total count */
  total: number;
  /** Sort column */
  orderBy?: string;
  /** Descending order */
  descending?: boolean;
  /** Search keyword */
  keyword?: string;
  /** Recycle mode */
  recycleBinActive: boolean;
  /** Loading state */
  loading: boolean;
  /** Data items */
  items: unknown[];
}

/**
 * Popover interface
 */
export interface PopoverType {
  title: ReactNode;
  position?: PopoverPosition;
  width?: string;
}

/**
 * PageButton interface (maps to existing DataTableButton)
 */
export interface PageButtonType {
  /** Button key */
  key: string;
  /** Button text */
  text: string;
  /** Button icon */
  icon?: ReactNode;
  /** Button alignment */
  align?: "left" | "right";
  /** Button color */
  color?: string;
  /** Click event */
  onClick: () => void;
  /** Display order */
  order?: number;
  /** Visibility */
  visible?: boolean;
  /** Disabled */
  disabled?: boolean;
  /** Loading */
  loading?: boolean;
  /** Flat style */
  flat?: boolean;
  /** Outline style */
  outline?: boolean;
  /** Variant style */
  variant?: "primary" | "ghost" | "success" | "warning" | "danger" | "info" | "secondary";
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Tooltip text */
  tooltip?: string;
  /** Custom CSS class name */
  className?: string;
  /** Popover callback (toolbar mode only) */
  popoverCallback?: (props: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
    popover: PopoverType;
  }) => ReactNode;
  popover?: PopoverType;
  render?: () => ReactNode;
  /** Permission code or verb */
  /** Use directly when it is a full permission code (contains ':', e.g. "system:role:modify") */
  /** If it is only a verb (e.g. "read", "create"), it will be combined as resource:verb */
  permission?: string;
}

/**
 * MenuButton interface (extends PageButtonType for ContextMenu with row data)
 * @template T - row data type
 */
export interface MenuButtonType<T = unknown> extends Omit<PageButtonType, "onClick" | "visible" | "disabled" | "variant"> {
  /** Click event - accepts row/index, or no args when row data is unnecessary */
  onClick: ((row: T, index: number) => void) | (() => void);
  /** Visibility - supports boolean or function (overrides PageButtonType visible) */
  visible?: boolean | ((row: T) => boolean);
  /** Disabled - supports boolean or function (overrides PageButtonType disabled) */
  disabled?: boolean | ((row: T) => boolean);
  /** Action color variant (overrides PageButtonType variant and adds "default") */
  variant?: "default" | "primary" | "danger" | "warning" | "success";
}

/**
 * DataTablePage component props
 */
export interface DataTablePageProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** API version */
  version?: string;
  /** API resource name */
  resource: string;
  /** Data transform function */
  transformItem?: (raw: unknown) => T;
  /** Searchable */
  searchable?: boolean;
  /** Initial search keyword */
  initialKeyword?: string;
  /** Initial page */
  initialPage?: number;
  /** Initial items per page */
  initialPageSize?: number;
  /** Items-per-page options */
  pageSizeOptions?: number[];
  /** Initial sort column */
  initialOrderBy?: string;
  /** Initial descending flag */
  initialDescending?: boolean;
  /** Supports recycle bin */
  recycleable?: boolean;
  /** Page buttons */
  pageButtons?: PageButtonType[] | ((state: DataTablePageInternalState) => PageButtonType[]);
  /** Row context menu */
  getRowContextMenu?: (row: T, index: number, state: DataTablePageInternalState) => PageButtonType[];
  /** Default query params */
  defaultParams?: Record<string, unknown>;
  /** CSS class name */
  className?: string;
  /** Header CSS class name */
  headerClassName?: string;
  /** Row CSS class name */
  rowClassName?: string;
  /** Row key */
  rowKey?: keyof T | ((row: T) => string);
}
