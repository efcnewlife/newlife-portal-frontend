import Label from "@/components/ui/label";
import { cn } from "@/utils";
import { ChangeEvent } from "react";
import { MdAccessTime } from "react-icons/md";

interface TimePickerProps {
  id: string;
  name?: string;
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: number;
  className?: string;
}

const TimePicker = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  min,
  max,
  step,
  className,
}: TimePickerProps) => {
  const inputClasses = cn(
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
    error && "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500 dark:focus:border-error-800",
    disabled && "opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800",
    className
  );

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <input
          type="time"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={inputClasses}
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <MdAccessTime className="size-6" />
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
    </div>
  );
};

export default TimePicker;
