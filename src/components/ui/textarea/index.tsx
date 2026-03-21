import React from "react";
import Label from "../label";

interface TextareaProps {
  id: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  label,
  placeholder = "Please enter message",
  rows = 3,
  value = "",
  onChange,
  className = "",
  disabled = false,
  error = undefined,
  hint = "",
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className} `;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed opacity40 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error && error !== undefined) {
    textareaClasses += ` bg-transparent border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 text-gray-900 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <textarea
          id={id}
          placeholder={placeholder}
          rows={rows}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={textareaClasses}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  );
};

export default TextArea;
