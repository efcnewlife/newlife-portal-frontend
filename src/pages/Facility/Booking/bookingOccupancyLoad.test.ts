import type { BookingListItem, BookingRangeParams } from "@/api/services/facilityService";
import type { ApiResponse } from "@/types/api";
import { describe, expect, it, vi } from "vitest";
import { loadBookingsForVisibleRange } from "./bookingOccupancyLoad";

describe("loadBookingsForVisibleRange", () => {
  it("loads via the booking range client for the visible window", async () => {
    const items: BookingListItem[] = [
      {
        id: "booking-1",
        userId: "user-1",
        bookingType: "personal",
        startAt: "2026-08-17T14:00:00.000Z",
        endAt: "2026-08-17T16:00:00.000Z",
        status: "confirmed",
      },
    ];
    const getBookingRange = vi.fn(
      async (_params: BookingRangeParams): Promise<ApiResponse<{ items: BookingListItem[] }>> => ({
        success: true,
        data: { items },
      })
    );

    const result = await loadBookingsForVisibleRange(
      { getBookingRange },
      {
        start: new Date("2026-08-17T00:00:00.000Z"),
        end: new Date("2026-08-24T00:00:00.000Z"),
      }
    );

    expect(getBookingRange).toHaveBeenCalledTimes(1);
    expect(getBookingRange).toHaveBeenCalledWith({
      dateFrom: "2026-08-17T00:00:00.000Z",
      dateTo: "2026-08-24T00:00:00.000Z",
    });
    expect(result).toEqual(items);
  });

  it("returns null when the range response is unsuccessful", async () => {
    const getBookingRange = vi.fn(async () => ({
      success: false,
      data: { items: [] },
    }));

    const result = await loadBookingsForVisibleRange(
      { getBookingRange },
      {
        start: new Date("2026-08-17T00:00:00.000Z"),
        end: new Date("2026-08-18T00:00:00.000Z"),
      }
    );

    expect(result).toBeNull();
  });
});
