export type BookingStatusBadgeColor = "success" | "warning" | "error" | "light";

/** Every Booking/occurrence status value the admin API returns (domain/facility/constants.py BookingStatus). */
export const BOOKING_STATUS_VALUES = ["draft", "pending_payment", "confirmed", "cancelled", "overridden"] as const;

/** Shared Booking/occurrence status → Badge color, so List, Calendar/Grid, and Series detail agree on one mapping. */
export const BOOKING_STATUS_BADGE_COLOR: Record<string, BookingStatusBadgeColor> = {
  pending_payment: "warning",
  confirmed: "success",
  cancelled: "light",
  overridden: "error",
};

export const bookingStatusBadgeColor = (status: string): BookingStatusBadgeColor =>
  BOOKING_STATUS_BADGE_COLOR[status] ?? "light";

export const isOverriddenBookingStatus = (status: string): boolean => status === "overridden";
