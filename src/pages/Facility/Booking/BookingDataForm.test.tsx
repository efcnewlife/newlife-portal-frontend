import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
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
import type { PreviewQuoteResponse } from "@/api/services/facilityService";
import BookingDataForm, { type BookingFormValues } from "./BookingDataForm";

const mockFacilityService = vi.hoisted(() => ({
  previewQuote: vi.fn(),
  evaluateDiscountEligibility: vi.fn(),
  listSurcharges: vi.fn(),
}));

vi.mock("@/api/services/facilityService", () => ({ facilityService: mockFacilityService }));
vi.mock("@/api/services/ministryService", () => ({
  default: {
    getMinistryList: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [{ id: "ministry-1", name: "Youth Ministry", status: "active" }] },
    }),
  },
}));
vi.mock("@/api/services/userService", () => ({
  default: { getList: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }) },
}));

vi.mock("@efcnewlife/newlife-ui", async () => {
  const React = await import("react");
  const Field = ({ label }: { label?: string }) => React.createElement("div", null, label);
  return {
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => React.createElement("button", { onClick, disabled, type: "button" }, children),
    ComboBox: Field,
    DateTimePicker: Field,
    Input: Field,
    Select: Field,
    TextArea: Field,
  };
});

const start = dayjs("2026-11-01T18:00:00Z");
const ministryDefaults: Partial<BookingFormValues> = {
  userId: "booker-1",
  title: "Youth night",
  facilityIds: ["room-without-rate", "room-2"],
  startAt: start,
  endAt: start.add(2, "hour"),
  ministryId: "ministry-1",
  surchargeCodes: [],
};
const personalDefaults: Partial<BookingFormValues> = { ...ministryDefaults, ministryId: null };

const freeMinistryQuote: PreviewQuoteResponse = {
  subtotalAmount: "0.00",
  discountPercent: "0",
  discountAmount: "0.00",
  surchargeAmount: "0.00",
  quotedAmount: "0.00",
  currency: "CAD",
  isFreeMinistry: true,
  roomLines: [
    {
      facilityId: "room-without-rate",
      billedHours: "2",
      rentalRateName: null,
      billingUnit: null,
      unitAmount: null,
      currency: "CAD",
      applicability: null,
      isDefault: false,
      lineSubtotal: "0.00",
    },
    {
      facilityId: "room-2",
      billedHours: "2",
      rentalRateName: null,
      billingUnit: null,
      unitAmount: null,
      currency: "CAD",
      applicability: null,
      isDefault: false,
      lineSubtotal: "0.00",
    },
  ],
};

const personalQuote: PreviewQuoteResponse = {
  subtotalAmount: "120.00",
  discountPercent: "0",
  discountAmount: "0.00",
  surchargeAmount: "0.00",
  quotedAmount: "120.00",
  currency: "CAD",
  isFreeMinistry: false,
  roomLines: [],
};

describe("BookingDataForm free Ministry pricing", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("labels an eligible Ministry proposal as free with a zero total, even for a Room with no Rental Rate", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.evaluateDiscountEligibility.mockResolvedValue({
      success: true,
      data: { discountCode: null, discountPercent: "0", isFreeMinistry: true },
    });
    mockFacilityService.previewQuote.mockResolvedValue({ success: true, data: freeMinistryQuote });
    const user = userEvent.setup();
    render(<BookingDataForm defaultValues={ministryDefaults} rooms={[]} />);

    expect(await screen.findByText(/free ministry booking/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Preview quote" }));

    const quote = await screen.findByText(/Quoted amount: 0\.00 CAD/);
    expect(quote).toHaveTextContent(/free ministry booking/i);
    expect(screen.queryByText(/discount \(\d+%\)/i)).not.toBeInTheDocument();
  });

  it("keeps Personal discount messaging for a Personal proposal", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.evaluateDiscountEligibility.mockResolvedValue({
      success: true,
      data: { discountCode: null, discountPercent: "0", isFreeMinistry: false },
    });
    mockFacilityService.previewQuote.mockResolvedValue({ success: true, data: personalQuote });
    const user = userEvent.setup();
    render(<BookingDataForm defaultValues={personalDefaults} rooms={[]} />);

    await user.click(screen.getByRole("button", { name: "Preview quote" }));

    const quote = await screen.findByText(/Quoted amount: 120\.00 CAD/);
    expect(quote).toHaveTextContent("No discount");
    expect(screen.queryByText(/free ministry booking/i)).not.toBeInTheDocument();
  });
});
