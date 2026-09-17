import { describe, expect, it } from "vitest";
import type { RecurringBookingConflict } from "@/api/services/facilityService";
import {
  blockingOccurrenceDates,
  canCreateRecurringSeriesWithExclusions,
  groupRecurringConflictsByDate,
  isBlackoutConflict,
  isOverridableOccupancyConflict,
  isProtectedMinistryConflict,
} from "./recurringSeriesConflicts";

const conflict = (overrides: Partial<RecurringBookingConflict>): RecurringBookingConflict => ({
  occurrenceDate: "2026-01-04",
  kind: "occupancy",
  facilityIds: ["room-1"],
  isOverridable: false,
  ministryId: null,
  ministryStewardDisplayName: null,
  ministryStewardEmail: null,
  ...overrides,
});

describe("groupRecurringConflictsByDate", () => {
  it("groups conflicts by occurrence date in ascending order", () => {
    const conflicts = [
      conflict({ occurrenceDate: "2026-01-18" }),
      conflict({ occurrenceDate: "2026-01-04" }),
      conflict({ occurrenceDate: "2026-01-04", kind: "blackout" }),
    ];
    const groups = groupRecurringConflictsByDate(conflicts);
    expect(groups.map((g) => g.occurrenceDate)).toEqual(["2026-01-04", "2026-01-18"]);
    expect(groups[0].conflicts).toHaveLength(2);
  });

  it("marks a date blocking when any conflict on it cannot be overridden", () => {
    const groups = groupRecurringConflictsByDate([
      conflict({ occurrenceDate: "2026-01-04", isOverridable: true }),
      conflict({ occurrenceDate: "2026-01-11", isOverridable: false }),
    ]);
    expect(groups.find((g) => g.occurrenceDate === "2026-01-04")?.isBlocking).toBe(false);
    expect(groups.find((g) => g.occurrenceDate === "2026-01-11")?.isBlocking).toBe(true);
  });
});

describe("blockingOccurrenceDates", () => {
  it("returns only dates with a non-overridable conflict", () => {
    const dates = blockingOccurrenceDates([
      conflict({ occurrenceDate: "2026-01-04", isOverridable: true }),
      conflict({ occurrenceDate: "2026-01-11", isOverridable: false }),
      conflict({ occurrenceDate: "2026-01-18", kind: "blackout" }),
    ]);
    expect(dates).toEqual(["2026-01-11", "2026-01-18"]);
  });
});

describe("canCreateRecurringSeriesWithExclusions", () => {
  it("is true once every blocking date is excluded", () => {
    const conflicts = [conflict({ occurrenceDate: "2026-01-04", isOverridable: false })];
    expect(canCreateRecurringSeriesWithExclusions(conflicts, [])).toBe(false);
    expect(canCreateRecurringSeriesWithExclusions(conflicts, ["2026-01-04"])).toBe(true);
  });

  it("is true with no conflicts at all", () => {
    expect(canCreateRecurringSeriesWithExclusions([], [])).toBe(true);
  });

  it("ignores an overridable-only conflict date", () => {
    const conflicts = [conflict({ occurrenceDate: "2026-01-04", isOverridable: true })];
    expect(canCreateRecurringSeriesWithExclusions(conflicts, [])).toBe(true);
  });
});

describe("conflict kind predicates", () => {
  it("isProtectedMinistryConflict is true only for kind ministry", () => {
    expect(isProtectedMinistryConflict(conflict({ kind: "ministry" }))).toBe(true);
    expect(isProtectedMinistryConflict(conflict({ kind: "occupancy" }))).toBe(false);
  });

  it("isBlackoutConflict is true only for kind blackout", () => {
    expect(isBlackoutConflict(conflict({ kind: "blackout" }))).toBe(true);
    expect(isBlackoutConflict(conflict({ kind: "weekly_quota" }))).toBe(false);
  });

  it("isOverridableOccupancyConflict requires occupancy kind and isOverridable", () => {
    expect(isOverridableOccupancyConflict(conflict({ kind: "occupancy", isOverridable: true }))).toBe(true);
    expect(isOverridableOccupancyConflict(conflict({ kind: "occupancy", isOverridable: false }))).toBe(false);
    expect(isOverridableOccupancyConflict(conflict({ kind: "ministry", isOverridable: true }))).toBe(false);
  });
});
