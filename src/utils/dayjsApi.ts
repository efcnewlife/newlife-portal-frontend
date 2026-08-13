import dayjs, { type Dayjs } from "./dayjsSetup";

/** Fixed conventional calendar day for time-of-day Day.js values (matches newlife-ui). */
export const TIME_OF_DAY_ANCHOR = "1970-01-01";

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_WITH_SECONDS_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const TIME_MINUTES_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const LOCAL_DATETIME_INPUT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export const getLocalTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const dayjsToApiDate = (value: Dayjs | null | undefined): string | undefined => {
  if (value == null || !value.isValid()) {
    return undefined;
  }
  return value.format("YYYY-MM-DD");
};

export const apiDateToDayjs = (value: string | null | undefined): Dayjs | null => {
  if (!value || !CALENDAR_DATE_PATTERN.test(value)) {
    return null;
  }
  const parsed = dayjs(value, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed : null;
};

export const dayjsToApiTime = (value: Dayjs | null | undefined): string | undefined => {
  if (value == null || !value.isValid()) {
    return undefined;
  }
  return value.format("HH:mm:ss");
};

export const apiTimeToDayjs = (value: string | null | undefined): Dayjs | null => {
  if (!value) {
    return null;
  }

  let hour = 0;
  let minute = 0;
  let second = 0;

  const withSeconds = TIME_WITH_SECONDS_PATTERN.exec(value);
  if (withSeconds) {
    hour = Number(withSeconds[1]);
    minute = Number(withSeconds[2]);
    second = Number(withSeconds[3]);
  } else {
    const minutesOnly = TIME_MINUTES_PATTERN.exec(value);
    if (!minutesOnly) {
      return null;
    }
    hour = Number(minutesOnly[1]);
    minute = Number(minutesOnly[2]);
  }

  const parsed = dayjs(
    `${TIME_OF_DAY_ANCHOR} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
    "YYYY-MM-DD HH:mm:ss",
    true
  );
  return parsed.isValid() ? parsed : null;
};

export const dayjsToApiUtcIso = (value: Dayjs | null | undefined): string | undefined => {
  if (value == null || !value.isValid()) {
    return undefined;
  }
  return value.utc().toISOString();
};

export const apiUtcIsoToDayjs = (value: string | null | undefined): Dayjs | null => {
  if (!value) {
    return null;
  }
  const parsed = dayjs.utc(value);
  return parsed.isValid() ? parsed : null;
};

/**
 * Parse a datetime-local style string (YYYY-MM-DDTHH:mm[:ss]) as wall clock
 * in the display timezone, returning a UTC Dayjs instant.
 */
export const localDatetimeInputToDayjs = (
  value: string | null | undefined,
  displayTimezone: string = getLocalTimezone()
): Dayjs | null => {
  if (!value) {
    return null;
  }

  const match = LOCAL_DATETIME_INPUT_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;
  const wall = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  const parsed =
    displayTimezone === "system"
      ? dayjs(wall, "YYYY-MM-DD HH:mm:ss", true).utc()
      : dayjs.tz(wall, "YYYY-MM-DD HH:mm:ss", displayTimezone).utc();

  return parsed.isValid() ? parsed : null;
};
