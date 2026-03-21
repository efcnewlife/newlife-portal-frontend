import { CalendarDay, CalendarEvent, CalendarMonth, DateRange } from "./types";

/**
 * Create a Date object in local timezone from a date string (YYYY-MM-DD) or Date object
 * This ensures the date is interpreted in local time, not UTC
 * @param dateInput Date string (YYYY-MM-DD) or Date object
 * @param time Optional time string (HH:mm:ss) or hours, minutes, seconds
 * @returns Date object in local timezone
 */
export const createLocalDate = (dateInput: string | Date, time?: { hours?: number; minutes?: number; seconds?: number }): Date => {
  if (dateInput instanceof Date) {
    // If it's already a Date, extract date parts and create a new local date
    const hours = time?.hours ?? dateInput.getHours();
    const minutes = time?.minutes ?? dateInput.getMinutes();
    const seconds = time?.seconds ?? dateInput.getSeconds();
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), hours, minutes, seconds);
  }

  // Parse date string (YYYY-MM-DD)
  const parts = dateInput.split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateInput}. Expected YYYY-MM-DD`);
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2], 10);
  const hours = time?.hours ?? 0;
  const minutes = time?.minutes ?? 0;
  const seconds = time?.seconds ?? 0;

  return new Date(year, month, day, hours, minutes, seconds);
};

/**
 * Create a Date object in local timezone from date and time string (YYYY-MM-DDTHH:mm:ss)
 * This ensures the date is interpreted in local time, not UTC
 * @param dateTimeString Date-time string (YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ssZ)
 * @returns Date object in local timezone
 */
export const createLocalDateTime = (dateTimeString: string): Date => {
  // Remove 'Z' suffix if present (indicates UTC)
  const cleanString = dateTimeString.replace(/Z$/, "");

  // Parse the date-time string
  const [datePart, timePart = "00:00:00"] = cleanString.split("T");
  const [hours = 0, minutes = 0, seconds = 0] = timePart.split(":").map(Number);

  return createLocalDate(datePart, { hours, minutes, seconds });
};

export const formatDate = (date: Date, format: "full" | "short" | "month-year" | "year" = "full"): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    case "month-year":
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "year":
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString("en-US", options);
  }
};

export const formatWeekday = (date: Date, format: "full" | "short" = "short"): string => {
  if (format === "full") {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  // Normalize to midnight for consistent calculations
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // Sunday = 0, so subtract day to get to Sunday (start of week)
  const diff = d.getDate() - day;
  const result = new Date(d);
  result.setDate(diff);
  return result;
};

export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

export const getWeekDates = (date: Date): Date[] => {
  const start = getStartOfWeek(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Ensure all dates are normalized to midnight
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
};

// Helper function to format date as YYYY-MM-DD in local timezone
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMonthDays = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  const firstDayOfMonth = firstDay.getDay();
  // Sunday = 0, so subtract firstDayOfMonth to get to the Sunday of that week
  startDate.setDate(startDate.getDate() - firstDayOfMonth);

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);
    const dateStr = formatDateString(currentDate);

    days.push({
      date: dateStr,
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: currentDate.getTime() === today.getTime(),
    });
  }

  return days;
};

export const getYearMonths = (year: number): CalendarMonth[] => {
  const months: CalendarMonth[] = [];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    const firstDayOfMonth = firstDay.getDay();
    // Sunday = 0, so subtract firstDayOfMonth to get to the Sunday of that week
    startDate.setDate(startDate.getDate() - firstDayOfMonth);

    const days: CalendarDay[] = [];
    const daysInMonth = lastDay.getDate();
    const totalDays = Math.ceil((startDate.getDate() - 1 + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      const dateStr = formatDateString(currentDate);

      days.push({
        date: dateStr,
        isCurrentMonth: currentDate.getMonth() === monthIndex,
        isToday: currentDate.getTime() === today.getTime(),
      });
    }

    months.push({
      name: monthNames[monthIndex],
      days,
    });
  }

  return months;
};

export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Normalize date to local timezone by extracting date parts
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dateStr = formatDateString(normalizedDate);

  return events.filter((event) => {
    // Extract date parts from event.start to compare in local timezone
    const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
    const eventStartNormalized = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
    return formatDateString(eventStartNormalized) === dateStr;
  });
};

export const filterEventsByDateRange = (events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] => {
  // Normalize dates to local timezone by extracting date parts
  const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
  const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

  return events.filter((event) => {
    // Event dates are already in their original timezone, compare directly
    const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
    const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
    // Event overlaps with the date range if it starts before the range ends and ends after the range starts
    return eventStart <= rangeEnd && eventEnd >= rangeStart;
  });
};

export const getTimeSlotPosition = (date: string | Date): number => {
  const dateObj = new Date(date);
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  // Each hour is 2 rows (2 * 3.5rem = 7rem), plus minutes as fraction
  return hours * 2 + minutes / 30;
};

export const getTimeSlotDuration = (start: string | Date, end: string | Date): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  // Convert minutes to row spans (each row is 30 minutes)
  return Math.ceil(diffMinutes / 30);
};

// Check if a date is within the valid range
// Compare dates by their date parts (year, month, day) to avoid timezone issues
export const isDateInRange = (date: Date, validRange?: DateRange): boolean => {
  if (!validRange) return true;

  // Normalize dates to local timezone by extracting date parts
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const rangeStart = new Date(validRange.start.getFullYear(), validRange.start.getMonth(), validRange.start.getDate());

  const rangeEnd = new Date(validRange.end.getFullYear(), validRange.end.getMonth(), validRange.end.getDate());

  return normalizedDate >= rangeStart && normalizedDate <= rangeEnd;
};

// Check if a date can navigate to previous period
// Compare dates by their date parts (year, month, day) to avoid timezone issues
export const canNavigatePrevious = (currentDate: Date, view: "day" | "week" | "month", validRange?: DateRange): boolean => {
  if (!validRange) return true;

  // Normalize range start to local timezone by extracting date parts
  const rangeStart = new Date(validRange.start.getFullYear(), validRange.start.getMonth(), validRange.start.getDate());

  switch (view) {
    case "day": {
      const previousViewStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
      // For day view, check if the previous day is in range
      return previousViewStart >= rangeStart;
    }
    case "week": {
      const startOfCurrentWeek = getStartOfWeek(currentDate);
      const endOfPreviousWeek = new Date(startOfCurrentWeek.getFullYear(), startOfCurrentWeek.getMonth(), startOfCurrentWeek.getDate() - 1);
      // For week view, allow navigation if the previous week overlaps with validRange
      // (i.e., if the previous week's end date is >= rangeStart)
      return endOfPreviousWeek >= rangeStart;
    }
    case "month": {
      const previousViewStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      // For month view, check if the previous month overlaps with validRange
      const lastDayOfPreviousMonth = new Date(previousViewStart.getFullYear(), previousViewStart.getMonth() + 1, 0);
      return lastDayOfPreviousMonth >= rangeStart;
    }
  }

  return false;
};

// Check if a date can navigate to next period
// Compare dates by their date parts (year, month, day) to avoid timezone issues
export const canNavigateNext = (currentDate: Date, view: "day" | "week" | "month", validRange?: DateRange): boolean => {
  if (!validRange) return true;

  // Normalize range end to local timezone by extracting date parts
  const rangeEnd = new Date(validRange.end.getFullYear(), validRange.end.getMonth(), validRange.end.getDate());

  let nextViewStart: Date;
  switch (view) {
    case "day": {
      nextViewStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      // For day view, check if the next day is in range
      return nextViewStart <= rangeEnd;
    }
    case "week": {
      const endOfCurrentWeek = getEndOfWeek(currentDate);

      // Calculate next week start (the day after current week ends)
      nextViewStart = new Date(endOfCurrentWeek.getFullYear(), endOfCurrentWeek.getMonth(), endOfCurrentWeek.getDate() + 1);

      // For week view, allow navigation if the next week overlaps with validRange
      // Next week overlaps if its start date is <= rangeEnd
      // This means the next week contains at least one day within the valid range
      // This allows navigation to the last week even if it extends beyond rangeEnd
      return nextViewStart <= rangeEnd;
    }
    case "month": {
      nextViewStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      // For month view, check if the next month overlaps with validRange
      // (i.e., if the next month's start date is <= rangeEnd)
      return nextViewStart <= rangeEnd;
    }
  }

  return false;
};
