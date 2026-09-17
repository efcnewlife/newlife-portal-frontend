import { describe, expect, it } from "vitest";
import type { BookingListItem } from "@/api/services/facilityService";
import { mapBookingsToCalendarEvents } from "./bookingCalendarMapping";

const booking = (overrides: Partial<BookingListItem> & Pick<BookingListItem, "id">): BookingListItem => ({
  userId: "user-1",
  bookingType: "one_time",
  status: "confirmed",
  startAt: "2026-01-05T10:00:00Z",
  endAt: "2026-01-05T11:00:00Z",
  facilityName: "Gym",
  ...overrides,
});

describe("mapBookingsToCalendarEvents", () => {
  it("omits cancelled bookings", () => {
    const events = mapBookingsToCalendarEvents([booking({ id: "c1", status: "cancelled" })], "Overridden");
    expect(events).toEqual([]);
  });

  it("keeps confirmed bookings without an extra status tag", () => {
    const events = mapBookingsToCalendarEvents([booking({ id: "b1" })], "Overridden");
    expect(events[0].tags).toEqual(["Gym"]);
  });

  it("appends the overridden label as an extra tag for overridden bookings", () => {
    const events = mapBookingsToCalendarEvents([booking({ id: "b1", status: "overridden" })], "Overridden");
    expect(events[0].tags).toEqual(["Gym", "Overridden"]);
  });

  it("falls back to facilityNames and drops the room tag when there is no room at all", () => {
    const withNames = mapBookingsToCalendarEvents(
      [booking({ id: "b1", facilityName: undefined, facilityNames: ["A", "B"] })],
      "Overridden"
    );
    expect(withNames[0].tags).toEqual(["A", "B"]);

    const withNone = mapBookingsToCalendarEvents([booking({ id: "b1", facilityName: undefined })], "Overridden");
    expect(withNone[0].tags).toEqual([]);
  });

  it("maps id/title/start/end and keeps the source booking as item", () => {
    const source = booking({ id: "b1", userDisplayName: "Jane" });
    const [event] = mapBookingsToCalendarEvents([source], "Overridden");
    expect(event).toMatchObject({
      id: "b1",
      title: "Jane",
      start: source.startAt,
      end: source.endAt,
      item: source,
    });
  });
});
