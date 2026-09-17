import { describe, expect, it } from "vitest";
import { isSameWeekday, occurrencePeriodForDate, weeklyOccurrenceDates } from "./recurringSeriesScheduling";

describe("occurrencePeriodForDate", () => {
  it("returns jan_jun for January through June", () => {
    expect(occurrencePeriodForDate("2026-01-04")).toBe("jan_jun");
    expect(occurrencePeriodForDate("2026-06-28")).toBe("jan_jun");
  });

  it("returns jul_dec for July through December", () => {
    expect(occurrencePeriodForDate("2026-07-05")).toBe("jul_dec");
    expect(occurrencePeriodForDate("2026-12-27")).toBe("jul_dec");
  });

  it("returns null for an invalid date", () => {
    expect(occurrencePeriodForDate("not-a-date")).toBeNull();
  });
});

describe("isSameWeekday", () => {
  it("is true for two Sundays four weeks apart", () => {
    expect(isSameWeekday("2026-01-04", "2026-02-01")).toBe(true);
  });

  it("is false when the weekdays differ", () => {
    expect(isSameWeekday("2026-01-04", "2026-01-05")).toBe(false);
  });

  it("is false for an invalid date", () => {
    expect(isSameWeekday("2026-01-04", "nope")).toBe(false);
  });
});

describe("weeklyOccurrenceDates", () => {
  it("returns every 7th day from first through last, inclusive", () => {
    expect(weeklyOccurrenceDates("2026-01-04", "2026-01-25")).toEqual([
      "2026-01-04",
      "2026-01-11",
      "2026-01-18",
      "2026-01-25",
    ]);
  });

  it("returns a single date when first and last are the same day", () => {
    expect(weeklyOccurrenceDates("2026-01-04", "2026-01-04")).toEqual(["2026-01-04"]);
  });

  it("returns an empty list when last is before first", () => {
    expect(weeklyOccurrenceDates("2026-01-11", "2026-01-04")).toEqual([]);
  });

  it("returns an empty list for invalid input", () => {
    expect(weeklyOccurrenceDates("nope", "2026-01-04")).toEqual([]);
  });
});
