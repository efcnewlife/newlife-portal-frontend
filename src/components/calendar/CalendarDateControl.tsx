import { usePickerLabels } from "@/hooks/usePickerLabels";
import { cn } from "@/utils";
import { DateCalendar } from "@efcnewlife/newlife-ui";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdCalendarMonth } from "react-icons/md";
import { dateToCalendarDateControlValue, dayjsToCalendarAnchorDate } from "./calendarAnchorDate";
import type { DateRange } from "./types";

interface CalendarDateControlProps {
  value: Date;
  onChange: (date: Date) => void;
  validRange?: DateRange;
  /** Classes for the icon trigger (nav segment styling). */
  triggerClassName?: string;
}

const CalendarDateControl = ({ value, onChange, validRange, triggerClassName }: CalendarDateControlProps) => {
  const { t } = useTranslation("calendar");
  const pickerLabels = usePickerLabels();
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-9 w-9 items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:relative dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
          triggerClassName
        )}
      >
        <span id={labelId} className="sr-only">
          {t("dateControl.open")}
        </span>
        <MdCalendarMonth className="size-5" />
      </button>
      {open ? (
        <div
          className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2"
          role="dialog"
          aria-label={t("dateControl.open")}
        >
          <DateCalendar
            value={dateToCalendarDateControlValue(value)}
            onChange={(next) => {
              const date = dayjsToCalendarAnchorDate(next);
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            minDate={validRange?.start}
            maxDate={validRange?.end}
            showTodayButton
            labels={{
              ...pickerLabels,
              today: t("today"),
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default CalendarDateControl;
