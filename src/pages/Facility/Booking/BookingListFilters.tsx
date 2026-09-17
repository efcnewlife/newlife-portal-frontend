import { usePickerLabels } from "@/hooks/usePickerLabels";
import { DatePicker, Input, Select } from "@efcnewlife/newlife-ui";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { MdSearch } from "react-icons/md";

interface Option {
  value: string;
  label: string;
}

interface BookingListFiltersProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  statusOptions: Option[];
  ministryId: string;
  onMinistryIdChange: (ministryId: string) => void;
  ministryOptions: Option[];
  dateFrom: Dayjs | null;
  onDateFromChange: (date: Dayjs | null) => void;
  dateTo: Dayjs | null;
  onDateToChange: (date: Dayjs | null) => void;
}

const BookingListFilters = ({
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  statusOptions,
  ministryId,
  onMinistryIdChange,
  ministryOptions,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: BookingListFiltersProps) => {
  const { t } = useTranslation("facility");
  const pickerLabels = usePickerLabels();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
      <Input
        id="booking-list-keyword"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={t("booking.filter.keywordPlaceholder")}
        icon={<MdSearch className="size-5 text-on-surface-variant" aria-hidden />}
        clearable
        wrapperClassName="min-w-[16rem] flex-1"
      />
      <Select
        id="booking-list-status"
        options={statusOptions}
        value={status}
        onChange={(value) => onStatusChange(String(value ?? ""))}
        wrapperClassName="w-44 shrink-0"
      />
      <Select
        id="booking-list-ministry"
        options={ministryOptions}
        value={ministryId}
        onChange={(value) => onMinistryIdChange(String(value ?? ""))}
        wrapperClassName="w-48 shrink-0"
      />
      <DatePicker
        id="booking-list-date-from"
        value={dateFrom}
        onChange={onDateFromChange}
        placeholder={t("booking.filter.dateFrom")}
        showTodayButton={false}
        clearable
        labels={pickerLabels}
        wrapperClassName="w-40 shrink-0"
      />
      <DatePicker
        id="booking-list-date-to"
        value={dateTo}
        onChange={onDateToChange}
        placeholder={t("booking.filter.dateTo")}
        showTodayButton={false}
        clearable
        labels={pickerLabels}
        wrapperClassName="w-40 shrink-0"
      />
    </div>
  );
};

export default BookingListFilters;
