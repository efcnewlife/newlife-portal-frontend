import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
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
import type { RecurringBookingSeriesDetail } from "@/api/services/facilityService";
import RecurringSeriesDetailPage from "./RecurringSeriesDetailPage";

const mockFacilityService = vi.hoisted(() => ({
  getBookingSeriesById: vi.fn(),
  getOverrideLogPages: vi.fn(),
  cancelBookingSeries: vi.fn(),
}));

vi.mock("@/api/services/facilityService", () => ({ facilityService: mockFacilityService }));
vi.mock("@/api/services/ministryService", () => ({
  default: {
    getMinistryById: vi.fn().mockResolvedValue({ success: true, data: { id: "ministry-1", name: "Youth Ministry" } }),
  },
}));
vi.mock("@/api/services/userService", () => ({
  default: { getById: vi.fn().mockResolvedValue({ success: true, data: { id: "booker-1", displayName: "Grace" } }) },
}));
vi.mock("@/context/AuthContext", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));
vi.mock("@/pages/Facility/shared/useRoomListOptions", () => ({
  useRoomListOptions: () => ({ roomLabelById: new Map([["room-1", "Chapel"]]) }),
}));

vi.mock("@efcnewlife/newlife-ui", async () => {
  const React = await import("react");
  return {
    Badge: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("span", { "data-testid": "badge" }, children),
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
      React.createElement("button", { onClick, type: "button" }, children),
    Spinner: ({ text }: { text?: string }) => React.createElement("div", null, text),
  };
});
vi.mock("./RecurringSeriesCancelModal", () => ({ default: () => null }));

const occurrence = (id: string, date: string, status: string, quotedAmount: string) => ({
  id,
  startAt: `${date}T18:00:00Z`,
  endAt: `${date}T20:00:00Z`,
  status,
  quotedAmount,
  currency: "CAD",
  facilityIds: ["room-1"],
});

const freeMinistrySeries: RecurringBookingSeriesDetail = {
  id: "series-1",
  userId: "booker-1",
  ministryId: "ministry-1",
  firstOccurrenceDate: "2026-11-01",
  lastOccurrenceDate: "2026-11-08",
  localStartTime: "18:00:00",
  localEndTime: "20:00:00",
  status: "confirmed",
  paymentHoldExpiresAt: null,
  quotedAmount: "0.00",
  currency: "CAD",
  occurrenceCount: 2,
  isPriority: false,
  confirmedById: null,
  occurrences: [
    occurrence("occ-1", "2026-11-01", "confirmed", "0.00"),
    occurrence("occ-2", "2026-11-08", "confirmed", "0.00"),
  ],
};

const personalPendingSeries: RecurringBookingSeriesDetail = {
  ...freeMinistrySeries,
  id: "series-2",
  ministryId: null,
  status: "pending_payment",
  paymentHoldExpiresAt: "2026-10-30T12:00:00Z",
  quotedAmount: "240.00",
  occurrences: [
    occurrence("occ-3", "2026-11-01", "pending_payment", "120.00"),
    occurrence("occ-4", "2026-11-08", "pending_payment", "120.00"),
  ],
};

const renderPage = (seriesId: string) =>
  render(
    <MemoryRouter initialEntries={[`/facility/booking-series/${seriesId}`]}>
      <Routes>
        <Route element={<RecurringSeriesDetailPage />} path="/facility/booking-series/:seriesId" />
      </Routes>
    </MemoryRouter>
  );

describe("RecurringSeriesDetailPage free Ministry Series", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a created free Ministry Series as Confirmed and free, with no payment deadline", async () => {
    mockFacilityService.getBookingSeriesById.mockResolvedValue({ success: true, data: freeMinistrySeries });
    mockFacilityService.getOverrideLogPages.mockResolvedValue({ success: true, data: { items: [] } });
    renderPage("series-1");

    expect(await screen.findByText("Series detail")).toBeInTheDocument();
    const badges = screen.getAllByTestId("badge").map((badge) => badge.textContent);
    expect(badges).toEqual(["Confirmed", "Free Ministry booking", "Confirmed", "Confirmed"]);
    expect(screen.getByText("0.00 CAD")).toBeInTheDocument();
    expect(screen.queryByText("Payment hold deadline")).not.toBeInTheDocument();
    expect(screen.queryByText(/pending payment/i)).not.toBeInTheDocument();
  });

  it("keeps the payment hold deadline for a Personal Series awaiting payment", async () => {
    mockFacilityService.getBookingSeriesById.mockResolvedValue({ success: true, data: personalPendingSeries });
    mockFacilityService.getOverrideLogPages.mockResolvedValue({ success: true, data: { items: [] } });
    renderPage("series-2");

    const deadlineLabel = await screen.findByText("Payment hold deadline");
    expect(within(deadlineLabel.parentElement as HTMLElement).queryByText("-")).not.toBeInTheDocument();
    expect(screen.queryByText("Free Ministry booking")).not.toBeInTheDocument();
  });
});
