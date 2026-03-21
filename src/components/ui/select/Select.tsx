import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdClose, MdKeyboardArrowDown, MdSearch } from "react-icons/md";
import { cn } from "../../../utils";
import Label from "../label";

export interface SelectOption {
  value: string | number | null;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number | null | (string | number | null)[];
  onChange?: (value: string | number | null | (string | number | null)[]) => void;
  placeholder?: string;
  id: string;
  name?: string;
  label?: string;
  disabled?: boolean;
  error?: string | undefined;
  success?: boolean;
  hint?: string;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "bordered" | "ghost";
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  id,
  name,
  label,
  disabled = false,
  error,
  success = false,
  hint,
  required = false,
  className = "",
  searchable = false,
  multiple = false,
  clearable = false,
  size = "md",
  variant = "default",
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get selected options
  const getSelectedOptions = (): SelectOption[] => {
    if (multiple && Array.isArray(value)) {
      return options.filter((option) => value.includes(option.value));
    } else if (!multiple && value !== undefined) {
      return options.filter((option) => option.value === value);
    }
    return [];
  };

  const selectedOptions = getSelectedOptions();
  const effective_placeholder = placeholder ?? t("common.selectPlaceholder");

  // Processing options click
  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return;

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(option.value)
        ? currentValue.filter((v) => v !== option.value)
        : [...currentValue, option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        if (searchable) {
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // size style
  const sizeClasses = {
    sm: "h-9 text-sm px-3 py-2",
    md: "h-11 text-sm px-4 py-2.5",
    lg: "h-12 text-base px-4 py-3",
  };

  // Variant style
  const variantClasses = {
    default:
      "bg-transparent border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
    bordered: "border-2 border-gray-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500",
    ghost: "border-0 bg-gray-100 focus:bg-white focus:ring-brand-500/20 dark:bg-gray-800 dark:focus:bg-gray-700",
  };

  // status style
  let stateClasses = "";
  if (disabled) {
    stateClasses =
      "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  } else if (error && error !== undefined) {
    stateClasses =
      "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800";
  } else if (success) {
    stateClasses =
      "border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800";
  } else {
    stateClasses = variantClasses[variant];
  }

  const selectClasses = cn(
    "relative w-full rounded-lg border appearance-none shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90",
    sizeClasses[size],
    stateClasses,
    className
  );

  return (
    <>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative" ref={selectRef}>
        {/* selector trigger */}
        <div
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          id={id}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedOptions.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {multiple ? (
                    selectedOptions.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-800 text-xs rounded-md dark:bg-brand-900 dark:text-brand-200"
                      >
                        {option.icon}
                        {option.label}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptionClick(option);
                          }}
                          className="hover:text-brand-600 dark:hover:text-brand-300"
                        >
                          <MdClose className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className={`flex items-center gap-2 truncate`}>
                      {selectedOptions[0]?.icon}
                      {selectedOptions[0]?.label}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-white/30">{effective_placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {clearable && selectedOptions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hover:text-gray-600 dark:hover:text-gray-300 focus:outline-hidden"
                  disabled={disabled}
                  aria-label={t("common.clearSelection")}
                >
                  <MdClose className="size-4 text-gray-400" />
                </button>
              )}
              <button
                type="button"
                className="flex items-center focus:outline-hidden"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                aria-label={t("common.toggleOptions")}
              >
                <MdKeyboardArrowDown
                  className={cn("size-5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        {/* drop down options */}
        <div
          className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-theme-lg dark:bg-gray-dark dark:border-gray-800",
            "transition-all duration-200 ease-out origin-top",
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none invisible"
          )}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("common.searchOptions")}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors",
                    index === focusedIndex && "bg-gray-100 dark:bg-gray-700",
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed dark:text-gray-600"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    multiple &&
                      selectedOptions.some((selected) => selected.value === option.value) &&
                      "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                  )}
                  onClick={() => handleOptionClick(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={selectedOptions.some((selected) => selected.value === option.value)}
                      onChange={() => {}}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  )}
                  {option.icon}
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{t("common.noOptions")}</div>
            )}
          </div>
        </div>

        {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}

        {/* Hidden form input */}
        <input type="hidden" name={name} value={Array.isArray(value) ? value.join(",") : value || ""} />
      </div>
    </>
  );
};
