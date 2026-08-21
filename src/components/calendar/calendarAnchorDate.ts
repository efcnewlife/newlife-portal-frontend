import dayjs, { type Dayjs } from "@/utils/dayjsSetup";

/** Convert a Calendar anchor Date to a Dayjs value for the Calendar date control. */
export const dateToCalendarDateControlValue = (date: Date): Dayjs => {
  return dayjs(date).startOf("day");
};

/**
 * Convert a Calendar date control Dayjs value to a local midnight Date.
 * Returns null when the value is missing or invalid (clear is not used for anchors).
 */
export const dayjsToCalendarAnchorDate = (value: Dayjs | null): Date | null => {
  if (value == null || !value.isValid()) {
    return null;
  }
  const next = value.toDate();
  next.setHours(0, 0, 0, 0);
  return next;
};
