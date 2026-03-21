import Label from "@/components/ui/label";
import { cn } from "@/utils";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useRef } from "react";
import { MdCalendarToday } from "react-icons/md";
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: (selectedDates: Date[], dateStr: string, instance: flatpickr.Instance) => void;
  value?: string; // YYYY-MM-DD format
  defaultDate?: DateOption;
  minDate?: string | Date; // YYYY-MM-DD format or Date
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  value,
  defaultDate,
  minDate,
  label,
  placeholder,
  error,
  required,
  disabled,
}: PropsType) {
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize flatpickr
  useEffect(() => {
    if (!inputRef.current) return;

    const options: flatpickr.Options.Options = {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value !== undefined && value !== "" ? value : defaultDate,
      onChange: (selectedDates, dateStr, instance) => {
        if (onChangeRef.current) {
          onChangeRef.current(selectedDates, dateStr, instance);
        }
      },
      disableMobile: true, // Use desktop version on mobile
    };

    if (minDate) {
      options.minDate = minDate;
    }

    if (disabled) {
      options.clickOpens = false;
    }

    flatpickrRef.current = flatpickr(inputRef.current, options);

    return () => {
      if (flatpickrRef.current && !Array.isArray(flatpickrRef.current)) {
        flatpickrRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id, disabled]);

  // Update value when it changes externally
  useEffect(() => {
    if (flatpickrRef.current && !Array.isArray(flatpickrRef.current)) {
      if (value !== undefined && value !== "") {
        const currentValue = flatpickrRef.current.input.value;
        if (currentValue !== value) {
          flatpickrRef.current.setDate(value, false);
        }
      } else if (value === "") {
        flatpickrRef.current.clear();
      }
    }
  }, [value]);

  // Update minDate when it changes
  useEffect(() => {
    if (flatpickrRef.current && !Array.isArray(flatpickrRef.current) && minDate !== undefined) {
      flatpickrRef.current.set("minDate", minDate);
    }
  }, [minDate]);

  // Update disabled state
  useEffect(() => {
    if (flatpickrRef.current && !Array.isArray(flatpickrRef.current)) {
      if (disabled) {
        flatpickrRef.current.close();
        flatpickrRef.current.set("clickOpens", false);
      } else {
        flatpickrRef.current.set("clickOpens", true);
      }
    }
  }, [disabled]);

  const inputClasses = cn(
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
    error && "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500 dark:focus:border-error-800",
    disabled && "opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800"
  );

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <input ref={inputRef} id={id} placeholder={placeholder} className={inputClasses} disabled={disabled} readOnly />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <MdCalendarToday className="size-6" />
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
    </div>
  );
}
