import { describe, expect, it } from "vitest";
import type { RecurringBookingSeriesOccurrence } from "@/api/services/facilityService";
import { affectedOccurrencesForScope, isCancellableOccurrence } from "./recurringSeriesCancellation";

const NOW = new Date("2026-02-01T00:00:00Z");

const occurrence = (overrides: Partial<RecurringBookingSeriesOccurrence>): RecurringBookingSeriesOccurrence => ({
  id: "occ-1",
  startAt: "2026-03-01T18:00:00Z",
  endAt: "2026-03-01T20:00:00Z",
  status: "confirmed",
  quotedAmount: "50.00",
  currency: "CAD",
  facilityIds: ["room-1"],
  ...overrides,
});

describe("isCancellableOccurrence", () => {
  it("is true for a live, future occurrence", () => {
    expect(isCancellableOccurrence(occurrence({}), NOW)).toBe(true);
  });

  it("is false once cancelled", () => {
    expect(isCancellableOccurrence(occurrence({ status: "cancelled" }), NOW)).toBe(false);
  });

  it("is false for a past occurrence", () => {
    expect(isCancellableOccurrence(occurrence({ startAt: "2026-01-01T18:00:00Z" }), NOW)).toBe(false);
  });
});

describe("affectedOccurrencesForScope", () => {
  const occurrences = [
    occurrence({ id: "past", startAt: "2026-01-01T18:00:00Z" }),
    occurrence({ id: "first", startAt: "2026-03-01T18:00:00Z" }),
    occurrence({ id: "second", startAt: "2026-03-08T18:00:00Z" }),
    occurrence({ id: "third", startAt: "2026-03-15T18:00:00Z", status: "cancelled" }),
  ];

  it("occurrence scope affects only the chosen occurrence", () => {
    expect(affectedOccurrencesForScope(occurrences, "occurrence", "second", NOW).map((o) => o.id)).toEqual(["second"]);
  });

  it("this_and_future affects the chosen occurrence and every live one after it", () => {
    expect(affectedOccurrencesForScope(occurrences, "this_and_future", "first", NOW).map((o) => o.id)).toEqual([
      "first",
      "second",
    ]);
  });

  it("entire_series affects every still-cancellable occurrence regardless of pivot", () => {
    expect(affectedOccurrencesForScope(occurrences, "entire_series", null, NOW).map((o) => o.id)).toEqual([
      "first",
      "second",
    ]);
  });

  it("returns an empty list when occurrence/this_and_future is missing its pivot", () => {
    expect(affectedOccurrencesForScope(occurrences, "occurrence", null, NOW)).toEqual([]);
    expect(affectedOccurrencesForScope(occurrences, "this_and_future", "unknown-id", NOW)).toEqual([]);
  });
});
