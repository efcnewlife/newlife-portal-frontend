import type React from "react";
import { cn } from "../../../utils";

interface SelectOptionProps {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const SelectOption: React.FC<SelectOptionProps> = ({ value, label, disabled = false, icon, className = "", children }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
        disabled
          ? "text-gray-400 cursor-not-allowed dark:text-gray-600"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
        className
      )}
      data-value={value}
      data-disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children || label}
    </div>
  );
};
