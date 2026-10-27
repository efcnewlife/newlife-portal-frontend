import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import RecurringSeriesCreateModal from "./RecurringSeriesCreateModal";
import type { RecurringSeriesDataFormHandle } from "./RecurringSeriesDataForm";

const mockFacilityService = vi.hoisted(() => ({
  previewBookingSeries: vi.fn(),
  createBookingSeries: vi.fn(),
  evaluateDiscountEligibility: vi.fn(),
  listSurcharges: vi.fn(),
}));

vi.mock("@/api/services/facilityService", () => ({ facilityService: mockFacilityService }));
vi.mock("@/api/services/ministryService", () => ({
  default: {
    getMinistryList: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [{ id: "ministry-1", name: "Youth Ministry", status: "active", hasPriorityBooking: false }] },
    }),
  },
}));
vi.mock("@/api/services/userService", () => ({
  default: { getList: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }) },
}));
vi.mock("@/utils/operationFeedback", () => ({ notifySuccess: vi.fn(), notifyApiError: vi.fn() }));

// Lets the create-flow test drive the modal through the form's handle instead of its date and time pickers.
const formStub = vi.hoisted(() => ({ handle: null as RecurringSeriesDataFormHandle | null }));
vi.mock("./RecurringSeriesDataForm", async (importOriginal) => {
  const React = await import("react");
  const actual = await importOriginal<typeof import("./RecurringSeriesDataForm")>();
  return {
    default: React.forwardRef<RecurringSeriesDataFormHandle, React.ComponentProps<typeof actual.default>>(
      function FormOrStub(props, ref) {
        React.useImperativeHandle(
          formStub.handle ? ref : null,
          () => formStub.handle as RecurringSeriesDataFormHandle,
          []
        );
        if (formStub.handle) return null;
        return React.createElement(actual.default, { ...props, ref });
      }
    ),
  };
});

vi.mock("@efcnewlife/newlife-ui", async () => {
  const React = await import("react");
  type Option = { value: string; label: string };
  const Field = ({ label }: { label?: string }) => React.createElement("div", null, label);
  return {
    Modal: ({
      isOpen,
      children,
      footer,
    }: {
      isOpen?: boolean;
      children?: React.ReactNode;
      footer?: React.ReactNode;
    }) => (isOpen ? React.createElement("div", { role: "dialog" }, children, footer) : null),
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => React.createElement("button", { onClick, disabled, type: "button" }, children),
    ComboBox: ({ label, onChange }: { label?: string; onChange?: (value: string | null) => void }) =>
      React.createElement("button", { type: "button", onClick: () => onChange?.("booker-1") }, `Pick ${label}`),
    Select: ({
      id,
      label,
      options,
      value,
      multiple,
      onChange,
    }: {
      id?: string;
      label?: string;
      options?: Option[];
      value?: string | string[];
      multiple?: boolean;
      onChange?: (value: string) => void;
    }) =>
      multiple
        ? React.createElement("div", null, label)
        : React.createElement(
            "div",
            null,
            React.createElement("label", { htmlFor: id }, label),
            React.createElement(
              "select",
              { id, value, onChange: (event: { target: { value: string } }) => onChange?.(event.target.value) },
              (options ?? []).map((option) =>
                React.createElement("option", { key: option.value, value: option.value }, option.label)
              )
            )
          ),
    Input: Field,
    DatePicker: Field,
    TimePicker: Field,
    TextArea: Field,
  };
});

const freeSeries: RecurringBookingSeriesDetail = {
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
  occurrences: [],
};

const eligibility = (isFreeMinistry: boolean, discountCode: string | null = null, discountPercent = "0") => ({
  success: true,
  data: { discountCode, discountPercent, isFreeMinistry },
});

describe("RecurringSeriesCreateModal free Ministry Repeated booking", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    formStub.handle = null;
  });

  it("keeps Ministry choice editable during creation and revalidates pricing when it changes", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.evaluateDiscountEligibility.mockImplementation(
      async (request: { ministryId: string | null }) =>
        request.ministryId ? eligibility(true) : eligibility(false, "recurring_weekly_monthly", "20")
    );
    const user = userEvent.setup();
    render(<RecurringSeriesCreateModal isOpen rooms={[]} onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Pick Booker" }));
    expect(await screen.findByText("Recurring discount (20%)")).toBeInTheDocument();

    const ministry = screen.getByLabelText("Ministry");
    expect(ministry).toBeEnabled();
    await screen.findByRole("option", { name: "Youth Ministry" });
    await user.selectOptions(ministry, "ministry-1");

    expect(await screen.findByText(/free ministry booking/i)).toBeInTheDocument();
    expect(screen.queryByText(/discount \(\d+%\)/i)).not.toBeInTheDocument();

    await user.selectOptions(ministry, "");
    expect(await screen.findByText("Recurring discount (20%)")).toBeInTheDocument();
  });

  it("creates a free Ministry Series from a no-hold preview and hands back the Confirmed Series", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.evaluateDiscountEligibility.mockResolvedValue(eligibility(true));
    mockFacilityService.previewBookingSeries.mockResolvedValue({
      success: true,
      data: { conflicts: [], quotedAmount: "0.00", currency: "CAD", isFreeMinistry: true },
    });
    mockFacilityService.createBookingSeries.mockResolvedValue({ success: true, data: freeSeries });
    const onCreated = vi.fn();
    formStub.handle = {
      validate: () => true,
      getTitle: () => "Youth night",
      getPreviewPayload: () => ({
        userId: "booker-1",
        ministryId: "ministry-1",
        firstOccurrenceDate: "2026-11-01",
        lastOccurrenceDate: "2026-11-08",
        localStartTime: "18:00",
        localEndTime: "20:00",
        rooms: [{ facilityId: "room-without-rate", sequence: 0 }],
      }),
      getOccurrenceCount: () => 2,
      isPriorityMinistry: () => false,
    };
    const user = userEvent.setup();
    render(<RecurringSeriesCreateModal isOpen rooms={[]} onClose={vi.fn()} onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(freeSeries));
    expect(mockFacilityService.createBookingSeries).toHaveBeenCalledWith(
      expect.objectContaining({ ministryId: "ministry-1", title: "Youth night" })
    );
  });
});
