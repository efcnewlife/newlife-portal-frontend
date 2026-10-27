import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    },
  });
});

import "@/i18n";
import type { BookingDetail } from "@/api/services/facilityService";
import BookingDetailDrawer from "./BookingDetailDrawer";

const booking = (overrides: Partial<BookingDetail> = {}): BookingDetail => ({
  id: "booking-1",
  title: "Youth night",
  userId: "booker-1",
  bookingType: "one_time",
  ministryId: "ministry-1",
  ministryName: "Youth Ministry",
  startAt: "2026-11-01T18:00:00Z",
  endAt: "2026-11-01T20:00:00Z",
  status: "confirmed",
  quotedAmount: "0.00",
  subtotalAmount: "0.00",
  discountAmount: "0.00",
  surchargeAmount: "0.00",
  currency: "CAD",
  isMissionAligned: true,
  rooms: [
    {
      id: "line-1",
      facilityId: "room-1",
      facilityName: "Chapel",
      sequence: 0,
      startAt: "2026-11-01T18:00:00Z",
      endAt: "2026-11-01T20:00:00Z",
      billedHours: "2",
      lineSubtotal: "0.00",
      currency: "CAD",
    },
  ],
  slots: [],
  ...overrides,
});

describe("BookingDetailDrawer free Ministry pricing", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("labels a saved free Ministry Booking with zero charges and no Rental Rate", () => {
    render(<BookingDetailDrawer booking={booking()} />);

    expect(screen.getByText("Pricing").nextElementSibling).toHaveTextContent("Free Ministry booking");
    expect(screen.getByText("Quoted amount").nextElementSibling).toHaveTextContent("0.00 CAD");
    expect(screen.getByText("Rate rule").nextElementSibling).toHaveTextContent("-");
  });

  it("does not label a Personal Booking as free", () => {
    render(
      <BookingDetailDrawer
        booking={booking({
          ministryId: undefined,
          ministryName: undefined,
          isMissionAligned: false,
          quotedAmount: "120.00",
        })}
      />
    );

    expect(screen.queryByText("Free Ministry booking")).not.toBeInTheDocument();
  });
});
