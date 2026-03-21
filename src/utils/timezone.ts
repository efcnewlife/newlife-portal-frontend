import moment from "moment-timezone";

/**
 * Common timezones list
 * Format: { value: timezone_name, label: display_name }
 */
export const COMMON_TIMEZONES = [
  { value: "Asia/Taipei", label: "Taipei (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Hongkong (UTC+8)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Seoul", label: "Seoul (UTC+9)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (UTC+8)" },
  { value: "Asia/Jakarta", label: "jakarta (UTC+7)" },
  { value: "Asia/Manila", label: "manila (UTC+8)" },
  { value: "Asia/Kolkata", label: "new delhi (UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Europe/London", label: "London (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "berlin (UTC+1/+2)" },
  { value: "Europe/Rome", label: "Rome (UTC+1/+2)" },
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)" },
  { value: "Europe/Amsterdam", label: "amsterdam (UTC+1/+2)" },
  { value: "America/New_York", label: "New York (UTC-5/-4)" },
  { value: "America/Chicago", label: "chicago (UTC-6/-5)" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "America/Toronto", label: "toronto (UTC-5/-4)" },
  { value: "America/Vancouver", label: "vancouver (UTC-8/-7)" },
  { value: "America/Sao_Paulo", label: "sao paul (UTC-3)" },
  { value: "America/Mexico_City", label: "mexico city (UTC-6/-5)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/+11)" },
  { value: "Australia/Melbourne", label: "Melbourne (UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)" },
];

/**
 * Get browser's local timezone
 * Returns IANA timezone name (e.g., "Asia/Taipei", "America/New_York")
 */
export const getLocalTimezone = (): string => {
  try {
    // Use Intl.DateTimeFormat to get the timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || "UTC";
  } catch (error) {
    console.error("Error getting local timezone:", error);
    return "UTC";
  }
};

/**
 * Get timezone offset string for display
 */
export const getTimezoneOffset = (timezone: string): string => {
  try {
    const offset = moment.tz(timezone).utcOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch {
    return "";
  }
};

/**
 * Format datetime string to local display format
 */
export const formatDateTimeLocal = (dateTimeString: string, timezone: string): string => {
  try {
    // Analyze first ISO string (probably UTC or format with time zone)
    let momentDate = moment(dateTimeString);
    if (!momentDate.isValid()) {
      return dateTimeString;
    }

    // Convert to specified time zone
    momentDate = momentDate.tz(timezone);

    // Format as datetime-local input format: YYYY-MM-DDTHH:mm
    return momentDate.format("YYYY-MM-DDTHH:mm");
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return dateTimeString;
  }
};

/**
 * Convert datetime-local string to ISO format without timezone
 */
export const convertDateTimeLocalToISO = (dateTimeLocalString: string, timezone: string = "UTC"): string => {
  try {
    // Parse as local time in the specified timezone
    const momentDate = moment.tz(dateTimeLocalString, "YYYY-MM-DDTHH:mm", timezone);
    if (!momentDate.isValid()) {
      throw new Error("Invalid datetime string");
    }
    // Format as ISO without timezone
    return momentDate.toISOString();
  } catch (error) {
    console.error("Error converting datetime:", error);
    throw error;
  }
};
