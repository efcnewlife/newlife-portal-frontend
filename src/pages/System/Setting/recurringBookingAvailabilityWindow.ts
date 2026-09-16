import type { ApiError } from "@/types/api";

export const RECURRING_BOOKING_AVAILABILITY_WINDOW_KEY = "recurring_booking_availability_window";

export const RECURRING_AVAILABILITY_UNITS = ["days", "weeks", "months"] as const;

export type RecurringAvailabilityUnit = (typeof RECURRING_AVAILABILITY_UNITS)[number];

export interface RecurringBookingAvailabilityWindow {
  amount: number;
  unit: RecurringAvailabilityUnit;
}

export type RecurringBookingAvailabilityWindowFieldError = "required" | "invalid";

export interface RecurringBookingAvailabilityWindowValidation {
  amount?: RecurringBookingAvailabilityWindowFieldError;
  unit?: RecurringBookingAvailabilityWindowFieldError;
}

type Translate = (key: string) => string;

const FACILITY_NAMESPACE = "facility";
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

export const isRecurringAvailabilityUnit = (value: unknown): value is RecurringAvailabilityUnit =>
  typeof value === "string" && (RECURRING_AVAILABILITY_UNITS as readonly string[]).includes(value);

export const isRecurringBookingAvailabilityWindowSetting = (namespace: string, settingKey: string): boolean =>
  namespace === FACILITY_NAMESPACE && settingKey === RECURRING_BOOKING_AVAILABILITY_WINDOW_KEY;

const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }
  if (typeof value === "string" && POSITIVE_INTEGER_PATTERN.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
};

export const parseRecurringBookingAvailabilityWindow = (value: unknown): RecurringBookingAvailabilityWindow | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const amount = parsePositiveInteger(record.amount);
  if (amount === null || !isRecurringAvailabilityUnit(record.unit)) {
    return null;
  }
  return { amount, unit: record.unit };
};

export const validateRecurringBookingAvailabilityWindow = (
  amountInput: string,
  unitInput: string
): RecurringBookingAvailabilityWindowValidation => {
  const errors: RecurringBookingAvailabilityWindowValidation = {};
  const trimmedAmount = amountInput.trim();
  if (trimmedAmount === "") {
    errors.amount = "required";
  } else if (parsePositiveInteger(trimmedAmount) === null) {
    errors.amount = "invalid";
  }
  const trimmedUnit = unitInput.trim();
  if (trimmedUnit === "") {
    errors.unit = "required";
  } else if (!isRecurringAvailabilityUnit(trimmedUnit)) {
    errors.unit = "invalid";
  }
  return errors;
};

export const buildRecurringBookingAvailabilityWindowValue = (
  amountInput: string,
  unitInput: string
): RecurringBookingAvailabilityWindow | null => {
  const errors = validateRecurringBookingAvailabilityWindow(amountInput, unitInput);
  if (errors.amount || errors.unit) {
    return null;
  }
  const amount = parsePositiveInteger(amountInput);
  const unit = unitInput.trim();
  if (amount === null || !isRecurringAvailabilityUnit(unit)) {
    return null;
  }
  return { amount, unit };
};

export const resolveRecurringBookingAvailabilityWindowSaveError = (
  error: unknown,
  t: Translate
): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }
  if (typeof error.details?.error_code === "string") {
    return undefined;
  }
  if (error.code !== 400) {
    return undefined;
  }
  return t("setting.form.validation.availabilityWindowRejected");
};
