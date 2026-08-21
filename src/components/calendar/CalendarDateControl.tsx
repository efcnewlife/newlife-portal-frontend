import { DatePicker } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import { dateToCalendarDateControlValue, dayjsToCalendarAnchorDate } from "./calendarAnchorDate";
import type { DateRange } from "./types";

interface CalendarDateControlProps {
  id?: string;
  value: Date;
  onChange: (date: Date) => void;
  validRange?: DateRange;
  className?: string;
}

const CalendarDateControl = ({
  id = "calendar-date-control",
  value,
  onChange,
  validRange,
  className,
}: CalendarDateControlProps) => {
  const { t } = useTranslation("calendar");
  const pickerLabels = usePickerLabels();

  return (
    <DatePicker
      id={id}
      value={dateToCalendarDateControlValue(value)}
      onChange={(next) => {
        const date = dayjsToCalendarAnchorDate(next);
        if (date) {
          onChange(date);
        }
      }}
      minDate={validRange?.start}
      maxDate={validRange?.end}
      clearable={false}
      showTodayButton
      size="sm"
      className={className}
      wrapperClassName="mb-0"
      labels={{
        ...pickerLabels,
        today: t("today"),
      }}
    />
  );
};

export default CalendarDateControl;
