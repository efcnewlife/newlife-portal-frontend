import { describe, expect, it } from "vitest";
import { getVisibleMonthWindow, monthCellSummaryCapacity, shiftMonthPreservingDay } from "./monthLayout";
import { formatDateString, getMonthDays } from "./utils";

describe("getVisibleMonthWindow", () => {
  it("returns the Sunday-start 6x7 window including adjacent-month padding", () => {
    // August 2026 starts on Saturday; grid starts Sunday Jul 26 and ends Sat Sep 5
    const window = getVisibleMonthWindow(new Date(2026, 7, 21));
    expect(formatDateString(window.start)).toBe("2026-07-26");
    expect(formatDateString(window.end)).toBe("2026-09-05");
    expect(window.start.getHours()).toBe(0);
    expect(window.end.getHours()).toBe(23);
    expect(window.end.getMinutes()).toBe(59);

    const days = getMonthDays(new Date(2026, 7, 21));
    expect(days).toHaveLength(42);
    expect(days[0]?.date).toBe(formatDateString(window.start));
    expect(days[41]?.date).toBe("2026-09-05");
  });
});

describe("monthCellSummaryCapacity", () => {
  it("fits as many lines as the content height allows", () => {
    expect(monthCellSummaryCapacity(54, { lineHeightPx: 18 })).toBe(3);
    expect(monthCellSummaryCapacity(17, { lineHeightPx: 18 })).toBe(0);
  });

  it("keeps at least one line when the day has events", () => {
    expect(monthCellSummaryCapacity(0, { lineHeightPx: 18, hasEvents: true })).toBe(1);
    expect(monthCellSummaryCapacity(40, { lineHeightPx: 18, hasEvents: true })).toBe(2);
  });
});

describe("shiftMonthPreservingDay", () => {
  it("steps by one month and keeps day-of-month when possible", () => {
    const next = shiftMonthPreservingDay(new Date(2026, 7, 21), 1);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(21);
  });

  it("clamps to the last day when the target month is shorter", () => {
    const next = shiftMonthPreservingDay(new Date(2026, 0, 31), 1);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });
});
