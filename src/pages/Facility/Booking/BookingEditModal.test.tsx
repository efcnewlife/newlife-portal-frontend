import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
import type { BookingDetail } from "@/api/services/facilityService";
import type { ApiError } from "@/types/api";
import BookingEditModal from "./BookingEditModal";

const mockFacilityService = vi.hoisted(() => ({
  updateBooking: vi.fn(),
  listSurcharges: vi.fn(),
}));

const mockFeedback = vi.hoisted(() => ({
  notifySuccess: vi.fn(),
  notifyApiError: vi.fn(),
}));

vi.mock("@/api/services/facilityService", () => ({ facilityService: mockFacilityService }));
vi.mock("@/api/services/ministryService", () => ({
  default: { getMinistryList: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }) },
}));
vi.mock("@/utils/operationFeedback", () => mockFeedback);

vi.mock("@efcnewlife/newlife-ui", async () => {
  const React = await import("react");
  type FieldProps = {
    id?: string;
    label?: string;
    value?: unknown;
    disabled?: boolean;
    hint?: string;
    onChange?: (event: { target: { value: string } }) => void;
  };
  const ModalForm = React.forwardRef(function ModalForm(
    {
      isOpen,
      title,
      children,
      footer,
      onSubmit,
    }: {
      isOpen?: boolean;
      title?: string;
      children?: React.ReactNode;
      footer?: React.ReactNode;
      onSubmit?: (event: React.FormEvent) => void;
    },
    ref: React.ForwardedRef<{ submit: () => void }>
  ) {
    const formRef = React.useRef<HTMLFormElement>(null);
    React.useImperativeHandle(ref, () => ({ submit: () => formRef.current?.requestSubmit() }));
    if (!isOpen) return null;
    return React.createElement(
      "div",
      { role: "dialog", "aria-label": title },
      React.createElement("form", { ref: formRef, onSubmit }, children),
      footer
    );
  });
  return {
    ModalForm,
    Alert: ({ title }: { title?: string }) => React.createElement("div", { role: "note" }, title),
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => React.createElement("button", { onClick, disabled, type: "button" }, children),
    Input: ({ id, label, value, disabled, hint, onChange }: FieldProps) =>
      React.createElement(
        "div",
        null,
        React.createElement("label", { htmlFor: id }, label),
        React.createElement("input", { id, value: String(value ?? ""), disabled, onChange }),
        hint ? React.createElement("p", null, hint) : null
      ),
    Select: ({ id, label }: FieldProps) =>
      React.createElement(
        "div",
        null,
        React.createElement("label", { htmlFor: id }, label),
        React.createElement("select", { id })
      ),
  };
});

const booking = (overrides: Partial<BookingDetail> = {}): BookingDetail => ({
  id: "booking-1",
  title: "Choir rehearsal",
  userId: "booker-1",
  bookingType: "one_time",
  ministryId: "ministry-1",
  ministryName: "Youth Ministry",
  startAt: "2026-11-01T18:00:00Z",
  endAt: "2026-11-01T20:00:00Z",
  status: "confirmed",
  quotedAmount: "0.00",
  currency: "CAD",
  isMissionAligned: true,
  rooms: [],
  slots: [],
  ...overrides,
});

const renderModal = (detail: BookingDetail) => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(<BookingEditModal booking={detail} isOpen onClose={onClose} onSaved={onSaved} rooms={[]} />);
  return { onSaved, onClose };
};

const lockedError = (): ApiError => ({
  code: 409,
  message: "Ministry association cannot change after creation; cancel and create a new booking",
  details: { error_code: "FACILITY_BOOKING_MINISTRY_ASSOCIATION_LOCKED", context: { booking_id: "booking-1" } },
});

describe("BookingEditModal locked Ministry association", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a Ministry Booking's association read-only and explains cancel-and-rebook", () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    renderModal(booking());

    const ministry = screen.getByLabelText("Ministry");
    expect(ministry).toBeDisabled();
    expect(ministry).toHaveValue("Youth Ministry");
    expect(screen.getByText(/cancel this booking and create a new one/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Surcharges")).not.toBeInTheDocument();
  });

  it("shows a Personal Booking as locked to No ministry, so it cannot switch to a Ministry", () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    renderModal(booking({ ministryId: undefined, ministryName: undefined, isMissionAligned: false }));

    const ministry = screen.getByLabelText("Ministry");
    expect(ministry).toBeDisabled();
    expect(ministry).toHaveValue("No ministry");
    expect(screen.getByLabelText("Surcharges")).toBeInTheDocument();
  });

  it("saves a title edit without submitting an association change", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.updateBooking.mockResolvedValue({ success: true, data: booking({ title: "Youth night" }) });
    const user = userEvent.setup();
    const { onSaved } = renderModal(booking());

    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Youth night");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mockFacilityService.updateBooking).toHaveBeenCalledTimes(1);
    const [id, payload] = mockFacilityService.updateBooking.mock.calls[0];
    expect(id).toBe("booking-1");
    expect(payload.title).toBe("Youth night");
    expect(payload).not.toHaveProperty("ministryId");
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("explains the server's immutable-association rejection and keeps the form open", async () => {
    mockFacilityService.listSurcharges.mockResolvedValue({ success: true, data: { items: [] } });
    mockFacilityService.updateBooking.mockRejectedValue(lockedError());
    const user = userEvent.setup();
    const { onSaved, onClose } = renderModal(booking());

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockFeedback.notifyApiError).toHaveBeenCalledTimes(1);
    const [error, options] = mockFeedback.notifyApiError.mock.calls[0];
    expect(options.resolveDescription(error)).toMatch(/cancel it and create a new booking/i);
  });
});
