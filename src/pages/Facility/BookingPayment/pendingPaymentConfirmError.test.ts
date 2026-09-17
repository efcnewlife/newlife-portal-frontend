import { describe, expect, it } from "vitest";
import type { ApiError } from "@/types/api";
import { resolveConfirmPaymentErrorMessage } from "./pendingPaymentConfirmError";

const t = (key: string): string => key;

const apiError = (overrides: Partial<ApiError> & { details?: ApiError["details"] }): ApiError => ({
  code: 400,
  message: "Recurring Booking Series is not Pending-payment",
  ...overrides,
});

describe("resolveConfirmPaymentErrorMessage", () => {
  it("returns a clear message when the Series is no longer Pending-payment (expired or already confirmed/cancelled)", () => {
    const error = apiError({
      code: 400,
      details: { error_code: "FACILITY_BOOKING_SERIES_NOT_PENDING_PAYMENT" },
    });
    expect(resolveConfirmPaymentErrorMessage(error, t)).toBe("facility:bookingPayment.errors.notPendingPayment");
  });

  it("returns a clear message when the Series was not found", () => {
    const error = apiError({
      code: 404,
      details: { error_code: "FACILITY_BOOKING_SERIES_NOT_FOUND" },
    });
    expect(resolveConfirmPaymentErrorMessage(error, t)).toBe("facility:bookingPayment.errors.notFound");
  });

  it("returns undefined for a plain 403 so the caller falls back to the generic forbidden toast", () => {
    const error = apiError({ code: 403, message: "Forbidden", details: { detail: "Forbidden" } });
    expect(resolveConfirmPaymentErrorMessage(error, t)).toBeUndefined();
  });

  it("returns undefined for non-ApiError values", () => {
    expect(resolveConfirmPaymentErrorMessage(new Error("boom"), t)).toBeUndefined();
  });
});
