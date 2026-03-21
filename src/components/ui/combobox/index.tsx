import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import { cn } from "../../../utils";
import Label from "../label";

export interface ComboBoxOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  imageUrl?: string;
  [key: string]: any;
}

interface ComboBoxPropsBase<T = any> {
  options: ComboBoxOption<T>[];
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
  inputClassName?: string;
  displayValue?: (option: ComboBoxOption<T> | null) => string;
  filterFunction?: (option: ComboBoxOption<T>, query: string) => boolean;
  renderOption?: (option: ComboBoxOption<T>) => React.ReactNode;
  allowCreate?: boolean;
  onCreateOption?: (query: string) => T;
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  onQueryChange?: (query: string) => void;
  /** Called when dropdown opens (focus or click toggle). Use to e.g. fetch options from API. */
  onOpen?: () => void;
  /** When true, dropdown shows loading state instead of options. */
  loading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface ComboBoxPropsSingle<T = any> extends ComboBoxPropsBase<T> {
  multiple?: false;
  value?: T | null;
  onChange?: (value: T | null) => void;
}

interface ComboBoxPropsMultiple<T = any> extends ComboBoxPropsBase<T> {
  multiple: true;
  value?: T[] | null;
  onChange?: (value: T[] | null) => void;
}

export type ComboBoxProps<T = any> = ComboBoxPropsSingle<T> | ComboBoxPropsMultiple<T>;

const defaultFilterFunction = <T,>(option: ComboBoxOption<T>, query: string): boolean => {
  return option.label.toLowerCase().includes(query.toLowerCase());
};

const defaultDisplayValue = <T,>(option: ComboBoxOption<T> | null): string => {
  return option?.label || "";
};

const defaultRenderOption = <T,>(option: ComboBoxOption<T>): React.ReactNode => {
  return (
    <div className="flex items-center">
      {option.imageUrl ? (
        <img
          src={option.imageUrl}
          alt=""
          className="size-6 shrink-0 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-700 dark:outline-white/10"
        />
      ) : (
        option.icon && <div className="size-6 shrink-0 flex items-center justify-center">{option.icon}</div>
      )}
      <span className={cn("block truncate", option.imageUrl || option.icon ? "ml-3" : "")}>{option.label}</span>
    </div>
  );
};

function OptionCheckbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-transparent bg-brand-500 text-white dark:bg-brand-400"
          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
        disabled && "opacity-50"
      )}
      role="checkbox"
      aria-checked={checked}
    >
      {checked && <MdCheck className="size-3.5" aria-hidden />}
    </span>
  );
}

export const ComboBox = <T = any,>(props: ComboBoxProps<T>) => {
  const {
    options,
    value,
    onChange,
    placeholder = "Please select or enter...",
    id,
    name,
    label,
    disabled = false,
    error,
    success = false,
    hint,
    required = false,
    className = "",
    inputClassName = "",
    displayValue = defaultDisplayValue,
    filterFunction = defaultFilterFunction,
    renderOption = defaultRenderOption,
    allowCreate = false,
    onCreateOption,
    clearable = false,
    size = "md",
    onQueryChange,
    onOpen,
    loading = false,
    inputRef: externalInputRef,
    onFocus: externalOnFocus,
    onBlur: externalOnBlur,
    multiple = false,
  } = props;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  const inputRef = externalInputRef || internalInputRef;

  // Notify parent when dropdown opens (so it can e.g. fetch options)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      onOpen?.();
    }
    if (!isOpen) wasOpenRef.current = false;
  }, [isOpen, onOpen]);

  const valueArray = multiple ? (Array.isArray(value) ? value : []) : [];
  const valueSingle = !multiple ? (value as T | null | undefined) : undefined;

  const selectedOption = !multiple ? options.find((option) => option.value === valueSingle) || null : null;

  const filteredOptions = query === "" ? options : options.filter((option) => filterFunction(option, query));

  const displayText = (() => {
    if (query) return query;
    if (multiple) {
      if (valueArray.length === 0) return "";
      if (valueArray.length === 1) {
        const opt = options.find((o) => o.value === valueArray[0]);
        return opt ? displayValue(opt) : String(valueArray[0]);
      }
      return `Selected ${valueArray.length} item`;
    }
    return selectedOption ? displayValue(selectedOption) : "";
  })();

  const canCreate =
    allowCreate && query.length > 0 && !filteredOptions.some((option) => option.label.toLowerCase() === query.toLowerCase());

  const handleSelect = (option: ComboBoxOption<T>) => {
    if (option.disabled) return;
    if (multiple) {
      const next = valueArray.includes(option.value)
        ? valueArray.filter((v) => v !== option.value)
        : [...valueArray, option.value];
      (onChange as (v: T[] | null) => void)?.(next.length > 0 ? next : null);
    } else {
      (onChange as (v: T | null) => void)?.(option.value);
      setQuery("");
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleCreate = () => {
    if (!onCreateOption || !canCreate) return;
    const newValue = onCreateOption(query);
    if (multiple) {
      (onChange as (v: T[] | null) => void)?.(valueArray.includes(newValue) ? valueArray : [...valueArray, newValue]);
    } else {
      (onChange as (v: T | null) => void)?.(newValue);
      setQuery("");
      setIsOpen(false);
      setFocusedIndex(-1);
    }
    if (!multiple) {
      setQuery("");
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      (onChange as (v: T[] | null) => void)?.(null);
    } else {
      (onChange as (v: T | null) => void)?.(null);
    }
    setQuery("");
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setFocusedIndex(-1);
    // trigger onQueryChange callback
    onQueryChange?.(newQuery);
  };

  // Handle input box losing focus
  const handleInputBlur = () => {
    // Delay closing so that click options can trigger properly
    setTimeout(() => {
      if (!comboboxRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setQuery("");
        setFocusedIndex(-1);
        // trigger onBlur callback
        externalOnBlur?.();
      }
    }, 200);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const allOptions = canCreate ? [{ value: null, label: query } as ComboBoxOption<T>, ...filteredOptions] : filteredOptions;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allOptions.length) {
          if (focusedIndex === 0 && canCreate) {
            handleCreate();
          } else {
            const optionIndex = canCreate ? focusedIndex - 1 : focusedIndex;
            const option = filteredOptions[optionIndex];
            if (option) {
              handleSelect(option);
            }
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        setQuery("");
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to focus option
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current) {
      const optionElements = optionsRef.current.querySelectorAll("[data-option-index]");
      const focusedElement = optionElements[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex]);

  // size style
  const sizeClasses = {
    sm: "h-9 text-sm px-3 py-2",
    md: "h-11 text-sm px-4 py-2.5",
    lg: "h-12 text-base px-4 py-3",
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
    stateClasses =
      "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800";
  }

  const hasClearButton =
    clearable &&
    (multiple ? valueArray.length > 0 : value !== null && value !== undefined);
  const rightPadding = hasClearButton ? "pr-16" : "pr-10";

  const inputClasses = cn(
    "block w-full rounded-lg border appearance-none shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30",
    sizeClasses[size],
    stateClasses,
    rightPadding,
    inputClassName
  );

  const allOptions = canCreate ? [{ value: null, label: query } as ComboBoxOption<T>, ...filteredOptions] : filteredOptions;

  return (
    <>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className={cn("relative", className)} ref={comboboxRef}>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            value={displayText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => {
              setIsOpen(true);
              externalOnFocus?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {clearable && value !== null && value !== undefined && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="hover:text-gray-600 dark:hover:text-gray-300 focus:outline-hidden"
                aria-label="Clear selection"
              >
                <MdClose className="size-4 text-gray-400" />
              </button>
            )}
            <button
              type="button"
              className="flex items-center focus:outline-hidden"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              aria-label="Toggle options"
            >
              <MdKeyboardArrowDown
                className={cn("size-5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* drop down options */}
        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-theme-lg outline outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 sm:text-sm",
            "transition-all duration-200 ease-out origin-top",
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none invisible"
          )}
          role="listbox"
        >
          <div ref={optionsRef} className="max-h-56 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="size-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-600 dark:border-t-brand-400" />
                loading...
              </div>
            ) : allOptions.length > 0 ? (
              <>
                {canCreate && (
                  <div
                    data-option-index={0}
                    className={cn(
                      "cursor-default flex items-center gap-2 px-3 py-2 select-none transition-colors",
                      focusedIndex === 0 ? "bg-brand-600 text-white dark:bg-brand-500" : "text-gray-900 dark:text-white",
                      "hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500"
                    )}
                    onClick={handleCreate}
                    onMouseEnter={() => setFocusedIndex(0)}
                    role="option"
                    aria-selected={focusedIndex === 0}
                  >
                    <span className="size-5 shrink-0" aria-hidden />
                    {renderOption({ value: null, label: query } as ComboBoxOption<T>)}
                  </div>
                )}
                {filteredOptions.map((option, index) => {
                  const optionIndex = canCreate ? index + 1 : index;
                  const isSelected = multiple
                    ? valueArray.includes(option.value)
                    : valueSingle === option.value;
                  return (
                    <div
                      key={String(option.value)}
                      data-option-index={optionIndex}
                      className={cn(
                        "cursor-default flex items-center gap-2 px-3 py-2 select-none transition-colors",
                        focusedIndex === optionIndex
                          ? "bg-brand-600 text-white dark:bg-brand-500"
                          : option.disabled
                          ? "text-gray-400 cursor-not-allowed dark:text-gray-600"
                          : "text-gray-900 dark:text-white",
                        !option.disabled && "hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500"
                      )}
                      onClick={() => !option.disabled && handleSelect(option)}
                      onMouseEnter={() => !option.disabled && setFocusedIndex(optionIndex)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                    >
                      <OptionCheckbox checked={isSelected} disabled={option.disabled} />
                      {renderOption(option)}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">No option found</div>
            )}
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}

        {/* Hidden form input */}
        {multiple ? (
          valueArray.map((v) => (
            <input key={String(v)} type="hidden" name={name} value={String(v)} />
          ))
        ) : (
          <input type="hidden" name={name} value={value != null ? String(value) : ""} />
        )}
      </div>
    </>
  );
};

export default ComboBox;
