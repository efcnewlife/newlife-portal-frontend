import Button from "@/components/ui/button";
import Popover from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { PopoverType } from "./types";

interface SearchPopoverContentProps {
  // Basic search functionality (backwards compatible)
  value?: string;
  onChange?: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder?: string;

  // Custom query content
  children?: React.ReactNode;

  // Popover Related
  trigger: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  popover: PopoverType;
}

export default function SearchPopoverContent({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder,
  children,
  trigger,
  isOpen,
  onOpenChange,
  popover,
}: SearchPopoverContentProps) {
  const { t } = useTranslation();
  const effective_placeholder = placeholder ?? t("common.enterKeyword");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Popover
      title={popover.title}
      trigger={trigger}
      position={popover.position}
      width={popover.width}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="p-4">
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={effective_placeholder}
              onKeyDown={(e) => handleKeyDown(e)}
              className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button variant="primary" size="sm" onClick={onSearch}>
            {t("common.search")}
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            {t("common.clear")}
          </Button>
        </div>
      </div>
    </Popover>
  );
}
