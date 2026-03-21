import moment from "moment";

// settings moment is localized into Traditional Chinese
moment.locale("zh-tw");

/**
 * Date and time tool class - use moment.js
 */
export class DateUtil {
  /**
   * parse date
   * @param date date value
   * @returns moment object
   */
  static parseDate(date: unknown): moment.Moment | null {
    if (!date) {
      return null;
    }

    const momentDate = moment(date);
    return momentDate.isValid() ? momentDate : null;
  }

  /**
   * Format date
   * @param date date value
   * @param format Format string, default 'YYYYYearMMmoonDDday HH:mm'
   * @returns Formatted date string
   */
  static format(date: unknown, format: string = "YYYYYearMMmoonDDday HH:mm"): string | undefined {
    const momentDate = this.parseDate(date);
    return momentDate ? momentDate.format(format) : undefined;
  }

  /**
   * Get current time
   * @param format Format string, default 'YYYY-MM-DD'
   * @returns Formatted current time string
   */
  static now(format: string = "YYYY-MM-DD"): string {
    return moment().format(format);
  }

  /**
   * Friendly time display (relative time)
   * @param dateTime date time
   * @returns friendly time string
   */
  static friendlyDate(dateTime: unknown): string {
    if (!dateTime) {
      return "";
    }

    const momentDate = this.parseDate(dateTime);
    if (!momentDate) return "";

    const now = moment();
    const diff = momentDate.diff(now);

    // If it is the future time
    if (diff > 0) {
      const duration = moment.duration(diff);
      const minutes = Math.floor(duration.asMinutes());
      const hours = Math.floor(duration.asHours());
      const days = Math.floor(duration.asDays());
      const months = Math.floor(duration.asMonths());

      if (minutes < 1) return "immediately";
      if (minutes < 60) return `${minutes}minutes later`;
      if (hours < 24) return `${hours}hours later`;
      if (days < 30) return `${days}queen of heaven`;
      if (months < 12) return `${months}months later`;
      return "long time later";
    }

    // past time
    const duration = moment.duration(-diff);
    const minutes = Math.floor(duration.asMinutes());
    const hours = Math.floor(duration.asHours());
    const days = Math.floor(duration.asDays());
    const months = Math.floor(duration.asMonths());

    if (minutes < 1) return "just";
    if (minutes < 60) return `${minutes}minutes ago`;
    if (hours < 24) return `${hours}hours ago`;
    if (days < 30) return `${days}days ago`;
    if (months < 12) return `${months}months ago`;
    return "a long time ago";
  }

  /**
   * Calculate remaining days
   * @param datetime target date time
   * @returns Days remaining
   */
  static leftDays(datetime: unknown): number | null {
    if (!datetime) {
      return null;
    }

    const momentDate = this.parseDate(datetime);
    if (!momentDate) return null;

    return momentDate.diff(moment(), "days");
  }

  /**
   * Check if the date is valid
   * @param date date value
   * @returns Is it a valid date?
   */
  static isValid(date: unknown): boolean {
    return moment(date as string | number | Date).isValid();
  }

  /**
   * Get relative time (using moment of fromNow）
   * @param dateTime date time
   * @returns relative time string
   */
  static fromNow(dateTime: unknown): string {
    if (!dateTime) return "";

    const momentDate = this.parseDate(dateTime);
    return momentDate ? momentDate.fromNow() : "";
  }

  /**
   * Formatted to Taiwan local time format
   * @param date date value
   * @param format Format string, default 'YYYY/MM/DD HH:mm'
   * @returns Formatted Taiwan local time string
   */
  static formatTaiwan(date: unknown, format: string = "YYYY/MM/DD HH:mm"): string | null {
    const momentDate = this.parseDate(date);
    return momentDate ? momentDate.format(format) : null;
  }
}
