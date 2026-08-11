import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  apiDateToDayjs,
  apiTimeToDayjs,
  apiUtcIsoToDayjs,
  dayjsToApiDate,
  dayjsToApiTime,
  dayjsToApiUtcIso,
  getLocalTimezone,
  localDatetimeInputToDayjs,
} from "./dayjsApi";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("dayjsApi calendar date", () => {
  it("formats Dayjs to YYYY-MM-DD for the API", () => {
    expect(dayjsToApiDate(dayjs("2026-03-15"))).toBe("2026-03-15");
  });

  it("returns undefined for nullish date inputs", () => {
    expect(dayjsToApiDate(null)).toBeUndefined();
    expect(dayjsToApiDate(undefined)).toBeUndefined();
  });

  it("parses YYYY-MM-DD into a calendar Dayjs value", () => {
    const value = apiDateToDayjs("2026-03-15");
    expect(value).not.toBeNull();
    expect(value!.format("YYYY-MM-DD")).toBe("2026-03-15");
  });

  it("returns null for empty or invalid API dates", () => {
    expect(apiDateToDayjs(null)).toBeNull();
    expect(apiDateToDayjs("")).toBeNull();
    expect(apiDateToDayjs("not-a-date")).toBeNull();
  });
});

describe("dayjsApi time-of-day", () => {
  it("formats time-of-day Dayjs to HH:mm:ss for the API", () => {
    const value = apiTimeToDayjs("09:30:00");
    expect(dayjsToApiTime(value)).toBe("09:30:00");
  });

  it("parses HH:mm and HH:mm:ss into an anchored time-of-day Dayjs", () => {
    const withSeconds = apiTimeToDayjs("17:45:30");
    expect(withSeconds).not.toBeNull();
    expect(withSeconds!.format("YYYY-MM-DD HH:mm:ss")).toBe("1970-01-01 17:45:30");

    const minutesOnly = apiTimeToDayjs("09:15");
    expect(minutesOnly).not.toBeNull();
    expect(minutesOnly!.format("HH:mm:ss")).toBe("09:15:00");
  });

  it("returns undefined/null for empty time values", () => {
    expect(dayjsToApiTime(null)).toBeUndefined();
    expect(apiTimeToDayjs(undefined)).toBeNull();
    expect(apiTimeToDayjs("")).toBeNull();
    expect(apiTimeToDayjs("25:00")).toBeNull();
  });
});

describe("dayjsApi datetime with local display zone", () => {
  const displayTimezone = "America/Toronto";

  it("round-trips a UTC ISO instant through local wall-clock display", () => {
    const utcIso = "2026-07-01T18:30:00.000Z";
    const value = apiUtcIsoToDayjs(utcIso);
    expect(value).not.toBeNull();
    expect(value!.utc().toISOString()).toBe(utcIso);

    const wall = value!.tz(displayTimezone).format("YYYY-MM-DD HH:mm");
    expect(wall).toBe("2026-07-01 14:30");
    expect(dayjsToApiUtcIso(value)).toBe(utcIso);
  });

  it("parses datetime-local style prefills as wall clock in the display timezone", () => {
    const value = localDatetimeInputToDayjs("2026-07-01T14:30", displayTimezone);
    expect(value).not.toBeNull();
    expect(dayjsToApiUtcIso(value)).toBe("2026-07-01T18:30:00.000Z");
  });

  it("returns undefined/null for empty datetime values", () => {
    expect(dayjsToApiUtcIso(null)).toBeUndefined();
    expect(apiUtcIsoToDayjs(null)).toBeNull();
    expect(localDatetimeInputToDayjs("")).toBeNull();
  });

  it("exposes the browser local timezone string", () => {
    expect(typeof getLocalTimezone()).toBe("string");
    expect(getLocalTimezone().length).toBeGreaterThan(0);
  });
});
