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
  static readonly DATETIME_DISPLAY_FORMAT = "YYYY-MM-DD hh:mm A";

  /**
   * Format date
   * @param date date value
   * @param format Format string, default DATETIME_DISPLAY_FORMAT
   * @returns Formatted date string
   */
  static format(date: unknown, format: string = DateUtil.DATETIME_DISPLAY_FORMAT): string | undefined {
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
