import type { BookingListItem, BookingRangeParams } from "@/api/services/facilityService";
import type { ApiResponse } from "@/types/api";

export type BookingRangeClient = {
  getBookingRange: (params: BookingRangeParams) => Promise<ApiResponse<{ items: BookingListItem[] }>>;
};

export type VisibleBookingRange = {
  start: Date;
  end: Date;
};

/**
 * Calendar / Grid occupancy load: complete window via Booking range query (not List pages).
 * Returns null when the response is unsuccessful so callers can keep the last good window.
 */
export const loadBookingsForVisibleRange = async (
  client: BookingRangeClient,
  range: VisibleBookingRange
): Promise<BookingListItem[] | null> => {
  const response = await client.getBookingRange({
    dateFrom: range.start.toISOString(),
    dateTo: range.end.toISOString(),
  });
  if (!response.success) {
    return null;
  }
  return response.data.items ?? [];
};
