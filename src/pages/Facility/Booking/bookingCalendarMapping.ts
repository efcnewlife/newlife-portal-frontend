import type { BookingListItem } from "@/api/services/facilityService";
import type { CalendarEvent } from "@/components/calendar";
import { isOverriddenBookingStatus } from "@/pages/Facility/shared/bookingStatusBadge";

/**
 * Cancelled bookings stay hidden from Calendar (existing, deliberate behavior); an
 * overridden booking still renders but gains an extra tag naming its status, since
 * Calendar has no per-status color system to lean on instead.
 */
export const mapBookingsToCalendarEvents = (bookings: BookingListItem[], overriddenLabel: string): CalendarEvent[] =>
  bookings
    .filter((booking) => booking.status !== "cancelled")
    .map((booking) => {
      const roomNames =
        booking.facilityNames && booking.facilityNames.length > 0
          ? booking.facilityNames
          : booking.facilityName
            ? [booking.facilityName]
            : [];
      const tags = isOverriddenBookingStatus(booking.status) ? [...roomNames, overriddenLabel] : roomNames;
      return {
        id: booking.id,
        title: booking.userDisplayName || booking.userEmail || "",
        start: booking.startAt,
        end: booking.endAt,
        tags,
        item: booking,
      };
    });
