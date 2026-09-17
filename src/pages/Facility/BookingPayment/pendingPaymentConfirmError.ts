import type { ApiError } from "@/types/api";

export const CONFIRM_PAYMENT_ERROR_CODE = {
  SERIES_NOT_FOUND: "FACILITY_BOOKING_SERIES_NOT_FOUND",
  SERIES_NOT_PENDING_PAYMENT: "FACILITY_BOOKING_SERIES_NOT_PENDING_PAYMENT",
} as const;

type Translate = (key: string) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

/**
 * Confirming an already-expired or already-cancelled Series is a rejected confirmation
 * (ADR 0022): the row must not be silently dropped, so this surfaces a clear reason
 * instead of the generic save-failed toast.
 */
export const resolveConfirmPaymentErrorMessage = (error: unknown, t: Translate): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }

  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;

  if (errorCode === CONFIRM_PAYMENT_ERROR_CODE.SERIES_NOT_PENDING_PAYMENT) {
    return t("facility:bookingPayment.errors.notPendingPayment");
  }

  if (errorCode === CONFIRM_PAYMENT_ERROR_CODE.SERIES_NOT_FOUND) {
    return t("facility:bookingPayment.errors.notFound");
  }

  return undefined;
};
