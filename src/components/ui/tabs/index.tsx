import type React from "react";
import { cn } from "@/utils";
import Label from "../label";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  required?: boolean;
  className?: string;
  /** Optional aria-label for the tablist (recommended when label is not visible or for a11y) */
  "aria-label"?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  onChange,
  id = "tabs",
  label,
  required = false,
  className,
  "aria-label": ariaLabel,
}) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </Label>
      )}
      <nav
        id={id}
        role="tablist"
        aria-label={ariaLabel ?? label ?? "Tabs"}
        className="-mb-px flex flex-wrap gap-x-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5"
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.value}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "inline-flex items-center border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out",
                isActive
                  ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
              )}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
