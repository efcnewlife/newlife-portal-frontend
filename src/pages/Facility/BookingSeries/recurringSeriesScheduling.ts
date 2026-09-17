import dayjs from "@/utils/dayjsSetup";

export type RecurringUsePeriod = "jan_jun" | "jul_dec";

const DATE_FORMAT = "YYYY-MM-DD";

/** Use periods are January-June and July-December (facility-local calendar months). */
export const occurrencePeriodForDate = (date: string): RecurringUsePeriod | null => {
  const parsed = dayjs(date, DATE_FORMAT, true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.month() <= 5 ? "jan_jun" : "jul_dec";
};

export const isSameWeekday = (dateA: string, dateB: string): boolean => {
  const a = dayjs(dateA, DATE_FORMAT, true);
  const b = dayjs(dateB, DATE_FORMAT, true);
  if (!a.isValid() || !b.isValid()) {
    return false;
  }
  return a.day() === b.day();
};

/** Mirrors the backend's weekly occurrence generation: every 7 days from first through last, inclusive. */
export const weeklyOccurrenceDates = (firstOccurrenceDate: string, lastOccurrenceDate: string): string[] => {
  const first = dayjs(firstOccurrenceDate, DATE_FORMAT, true);
  const last = dayjs(lastOccurrenceDate, DATE_FORMAT, true);
  if (!first.isValid() || !last.isValid() || last.isBefore(first, "day")) {
    return [];
  }
  const dates: string[] = [];
  let cursor = first;
  while (!cursor.isAfter(last, "day")) {
    dates.push(cursor.format(DATE_FORMAT));
    cursor = cursor.add(7, "day");
  }
  return dates;
};
