import type React from "react";
import type { FC } from "react";
import { MdClose } from "react-icons/md";
import { cn } from "@/utils";
import Label from "@/components/ui/label";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string | number | undefined;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: string | undefined;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconClick?: () => void;
  required?: boolean;
  clearable?: boolean;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error,
  hint,
  icon,
  iconPosition = "left",
  iconClick,
  required = false,
  clearable = false,
}) => {
  // Determine whether the clear button should be displayed
  // password Types should normally not have a clear button (but overrides are allowed), other types are shown when there is a value
  const shouldShowClear = clearable && value !== null && value !== undefined && value !== "" && type !== "password"; // password Type does not show clear button by default

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // Calculate the right side padding
  const rightPadding = shouldShowClear ? "pr-10" : "";

  let inputClasses = cn(
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    rightPadding,
    className
  );

  if (disabled) {
    inputClasses = cn(
      inputClasses,
      "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    );
  } else if (error && error !== undefined) {
    inputClasses = cn(
      inputClasses,
      "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
    );
  } else if (success) {
    inputClasses = cn(
      inputClasses,
      "border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800"
    );
  } else {
    inputClasses = cn(
      inputClasses,
      "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
    );
  }

  const iconClasses = `absolute z-30 -translate-y-1/2 top-1/2 ${iconPosition === "left" ? "left-4" : "right-4"} ${
    iconClick ? "cursor-pointer" : ""
  }
  `;

  const inputPadding = icon ? (iconPosition === "left" ? "pl-11" : "pr-11") : "";

  return (
    <>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`${inputPadding} ${inputClasses}`}
        />

        {shouldShowClear && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-hidden hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear input"
          >
            <MdClose className="size-4 text-gray-400" />
          </button>
        )}
        {icon && (
          <span className={iconClasses} onClick={iconClick}>
            {icon}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  );
};

export default Input;
