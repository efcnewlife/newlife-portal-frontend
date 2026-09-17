import { describe, expect, it } from "vitest";
import type { OverrideLogItem, RecurringBookingSeriesOccurrence } from "@/api/services/facilityService";
import { filterOverrideLogsForOccurrences, uniqueOccurrenceFacilityIds } from "./recurringSeriesOverrideHistory";

const occurrence = (id: string, facilityIds: string[] = ["room-1"]): RecurringBookingSeriesOccurrence => ({
  id,
  startAt: "2026-03-01T18:00:00Z",
  endAt: "2026-03-01T20:00:00Z",
  status: "confirmed",
  quotedAmount: "50.00",
  currency: "CAD",
  facilityIds,
});

const log = (overrides: Partial<OverrideLogItem>): OverrideLogItem => ({
  id: "log-1",
  facilityBookingId: "occ-a",
  overriddenById: "operator-1",
  facilityId: "room-1",
  outcome: "override_applied",
  createdAt: "2026-02-01T00:00:00Z",
  ...overrides,
});

describe("filterOverrideLogsForOccurrences", () => {
  it("keeps only logs whose overriding booking is one of the Series occurrences", () => {
    const occurrences = [occurrence("occ-a"), occurrence("occ-b")];
    const logs = [log({ id: "log-1", facilityBookingId: "occ-a" }), log({ id: "log-2", facilityBookingId: "occ-x" })];
    expect(filterOverrideLogsForOccurrences(logs, occurrences).map((l) => l.id)).toEqual(["log-1"]);
  });

  it("returns an empty list when there are no matching logs", () => {
    expect(filterOverrideLogsForOccurrences([log({ facilityBookingId: "occ-x" })], [occurrence("occ-a")])).toEqual([]);
  });
});

describe("uniqueOccurrenceFacilityIds", () => {
  it("returns every distinct room used across all occurrences", () => {
    const occurrences = [
      occurrence("occ-a", ["room-1", "room-2"]),
      occurrence("occ-b", ["room-2"]),
      occurrence("occ-c", ["room-3"]),
    ];
    expect(uniqueOccurrenceFacilityIds(occurrences)).toEqual(["room-1", "room-2", "room-3"]);
  });

  it("returns an empty list for no occurrences", () => {
    expect(uniqueOccurrenceFacilityIds([])).toEqual([]);
  });
});
