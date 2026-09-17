import { describe, expect, it } from "vitest";
import type { BookingListItem } from "@/api/services/facilityService";
import { groupBookingsBySeries } from "./bookingSeriesGrouping";

const booking = (overrides: Partial<BookingListItem> & Pick<BookingListItem, "id" | "startAt">): BookingListItem => ({
  userId: "user-1",
  bookingType: "recurring",
  status: "confirmed",
  endAt: overrides.startAt,
  ...overrides,
});

describe("groupBookingsBySeries", () => {
  it("collapses occurrences sharing a seriesId into one row with the total count", () => {
    const rows = groupBookingsBySeries([
      booking({ id: "o1", seriesId: "s1", startAt: "2026-01-05T00:00:00Z" }),
      booking({ id: "o2", seriesId: "s1", startAt: "2026-01-12T00:00:00Z" }),
      booking({ id: "o3", seriesId: "s1", startAt: "2026-01-19T00:00:00Z" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].occurrenceCount).toBe(3);
  });

  it("keeps one-time bookings as their own singleton group", () => {
    const rows = groupBookingsBySeries([
      booking({ id: "one-time", startAt: "2026-01-05T00:00:00Z" }),
      booking({ id: "o1", seriesId: "s1", startAt: "2026-01-12T00:00:00Z" }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === "one-time")?.occurrenceCount).toBe(1);
  });

  it("uses the earliest occurrence by startAt as the representative row", () => {
    const rows = groupBookingsBySeries([
      booking({ id: "later", seriesId: "s1", startAt: "2026-01-19T00:00:00Z" }),
      booking({ id: "earliest", seriesId: "s1", startAt: "2026-01-05T00:00:00Z" }),
    ]);
    expect(rows[0].id).toBe("earliest");
    expect(rows[0].occurrenceCount).toBe(2);
  });

  it("preserves first-seen group order", () => {
    const rows = groupBookingsBySeries([
      booking({ id: "a", seriesId: "s-a", startAt: "2026-01-05T00:00:00Z" }),
      booking({ id: "b", seriesId: "s-b", startAt: "2026-01-06T00:00:00Z" }),
      booking({ id: "c", seriesId: "s-a", startAt: "2026-01-07T00:00:00Z" }),
    ]);
    expect(rows.map((row) => row.seriesId)).toEqual(["s-a", "s-b"]);
  });

  it("returns an empty list for an empty page", () => {
    expect(groupBookingsBySeries([])).toEqual([]);
  });
});
