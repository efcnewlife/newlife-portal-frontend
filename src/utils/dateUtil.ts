import dayjs from "./dayjsSetup";

const parseDisplayDate = (date: unknown) => {
  if (!date) {
    return null;
  }

  const parsed = dayjs(date as string | number | Date);
  return parsed.isValid() ? parsed : null;
};

/**
 * Date and time display facade. Locale for relative time is driven by
 * `@/i18n` (`sync_dayjs_locale`) so `fromNow()` matches UI language.
 */
export class DateUtil {
  /**
   * Format date
   * @param date date value
   * @param format Format string, default 'YYYY-MM-DD HH:mm'
   * @returns Formatted date string
   */
  static format(date: unknown, format: string = "YYYY-MM-DD HH:mm"): string | undefined {
    const parsed = parseDisplayDate(date);
    return parsed ? parsed.format(format) : undefined;
  }

  /**
   * Friendly time display (relative time)
   * @param dateTime date time
   * @returns friendly time string
   */
  static friendlyDate(dateTime: unknown): string {
    const parsed = parseDisplayDate(dateTime);
    return parsed ? parsed.fromNow() : "";
  }
}
