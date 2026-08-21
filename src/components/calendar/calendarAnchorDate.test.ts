import { describe, expect, it } from "vitest";
import dayjs from "@/utils/dayjsSetup";
import { dateToCalendarDateControlValue, dayjsToCalendarAnchorDate } from "./calendarAnchorDate";

describe("dateToCalendarDateControlValue", () => {
  it("normalizes the Calendar anchor Date to local start of day", () => {
    const value = dateToCalendarDateControlValue(new Date(2026, 7, 21, 15, 45, 30));
    expect(value.format("YYYY-MM-DD HH:mm:ss")).toBe("2026-08-21 00:00:00");
  });
});

describe("dayjsToCalendarAnchorDate", () => {
  it("returns a local midnight Date for a valid Dayjs value", () => {
    const date = dayjsToCalendarAnchorDate(dayjs("2026-08-21 15:45:30"));
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(7);
    expect(date!.getDate()).toBe(21);
    expect(date!.getHours()).toBe(0);
    expect(date!.getMinutes()).toBe(0);
    expect(date!.getSeconds()).toBe(0);
  });

  it("returns null for null or invalid Dayjs values", () => {
    expect(dayjsToCalendarAnchorDate(null)).toBeNull();
    expect(dayjsToCalendarAnchorDate(dayjs("not-a-date"))).toBeNull();
  });
});
