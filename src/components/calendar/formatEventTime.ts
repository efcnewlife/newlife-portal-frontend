const padMinute = (minute: number): string => minute.toString().padStart(2, "0");

const periodOf = (date: Date): "am" | "pm" => (date.getHours() < 12 ? "am" : "pm");

const format12hClock = (date: Date, includePeriod: boolean): string => {
  const hour24 = date.getHours();
  const minute = date.getMinutes();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const clock = minute === 0 ? `${hour12}` : `${hour12}:${padMinute(minute)}`;
  if (!includePeriod) {
    return clock;
  }
  return `${clock}${periodOf(date)}`;
};

const format24hClock = (date: Date): string => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  return minute === 0 ? `${hour}` : `${hour}:${padMinute(minute)}`;
};

/**
 * Formats a single clock time for Calendar event blocks.
 * English uses Google-style 12h (lowercase am/pm, omit :00).
 * Other locales use 24h without a period suffix.
 */
export const formatEventTimeClock = (date: Date, locale: string): string => {
  if (locale.startsWith("en")) {
    return format12hClock(date, true);
  }
  return format24hClock(date);
};

/**
 * Formats a start-end range like Google Calendar week/day blocks.
 * English same period: "1:35 – 4:35pm"; cross period: "11:30am – 1pm".
 * Other locales: "13:35 – 16:35" (omit :00).
 */
export const formatEventTimeRange = (start: Date, end: Date, locale: string): string => {
  if (!locale.startsWith("en")) {
    return `${format24hClock(start)} – ${format24hClock(end)}`;
  }

  const samePeriod = periodOf(start) === periodOf(end);
  const startText = format12hClock(start, !samePeriod);
  const endText = format12hClock(end, true);
  return `${startText} – ${endText}`;
};
