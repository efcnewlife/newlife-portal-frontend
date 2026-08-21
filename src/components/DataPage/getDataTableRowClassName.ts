import { cn } from "@/utils";

export interface GetDataTableRowClassNameOptions {
  isSelected: boolean;
  rowHover: boolean;
  rowClassName?: string;
}

const DATA_ROW_BASE_CLASS = "border-l border-b border-gray-100 dark:border-white/[0.05] transition-colors";

export function getDataTableRowClassName({
  isSelected,
  rowHover,
  rowClassName,
}: GetDataTableRowClassNameOptions): string {
  return cn(
    DATA_ROW_BASE_CLASS,
    isSelected && "bg-primary-container/40",
    rowHover && (isSelected ? "hover:bg-primary-container/60" : "hover:bg-surface-variant"),
    rowClassName
  );
}
