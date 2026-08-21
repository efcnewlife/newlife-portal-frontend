import { getMonthDays } from "./utils";

export const DEFAULT_MONTH_SUMMARY_LINE_HEIGHT_PX = 16;

/**
 * Visible month grid window (Sunday-start 6x7) for the Calendar month layout.
 * Includes adjacent-month padding days.
 */
export const getVisibleMonthWindow = (anchorDate: Date): { start: Date; end: Date } => {
  const days = getMonthDays(anchorDate);
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  if (!first || !last) {
    const start = new Date(anchorDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const [startYear, startMonth, startDay] = first.split("-").map(Number);
  const [endYear, endMonth, endDay] = last.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
  const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
  return { start, end };
};

/**
 * How many compact summary lines fit in a month cell's content area.
 * When the day has events, capacity is at least one line.
 */
export const monthCellSummaryCapacity = (
  availableHeightPx: number,
  options?: {
    lineHeightPx?: number;
    hasEvents?: boolean;
  }
): number => {
  const lineHeightPx = options?.lineHeightPx ?? DEFAULT_MONTH_SUMMARY_LINE_HEIGHT_PX;
  const hasEvents = options?.hasEvents ?? false;
  if (lineHeightPx <= 0) {
    return hasEvents ? 1 : 0;
  }
  const fitted = Math.floor(Math.max(0, availableHeightPx) / lineHeightPx);
  if (hasEvents) {
    return Math.max(1, fitted);
  }
  return fitted;
};

/**
 * Step Calendar anchor by whole months, preserving day-of-month when possible
 * (clamps to the last day of the target month).
 */
export const shiftMonthPreservingDay = (date: Date, deltaMonths: number): Date => {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + deltaMonths);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
};
