import type { ApiError } from "@/types/api";

const FACILITY_NAMESPACE = "facility";

export const RECURRING_BOOKING_TEST_WINDOW_OVERRIDE_KEY = "recurring_booking_test_window_override";
export const RECURRING_BOOKING_TEST_BOOKER_ALLOWLIST_KEY = "recurring_booking_test_booker_allowlist";

export interface RecurringBookingTestBookerAllowlist {
  emailAddresses: string[];
  emailSuffixes: string[];
}

export type RecurringBookingTestBookerAllowlistFieldError = "invalidSuffix";

export interface RecurringBookingTestBookerAllowlistValidation {
  emailSuffixes?: RecurringBookingTestBookerAllowlistFieldError;
}

type Translate = (key: string) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

export const isRecurringBookingTestWindowOverrideSetting = (namespace: string, settingKey: string): boolean =>
  namespace === FACILITY_NAMESPACE && settingKey === RECURRING_BOOKING_TEST_WINDOW_OVERRIDE_KEY;

export const isRecurringBookingTestBookerAllowlistSetting = (namespace: string, settingKey: string): boolean =>
  namespace === FACILITY_NAMESPACE && settingKey === RECURRING_BOOKING_TEST_BOOKER_ALLOWLIST_KEY;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const parseRecurringBookingTestBookerAllowlist = (
  value: unknown
): RecurringBookingTestBookerAllowlist | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (!isStringArray(record.emailAddresses) || !isStringArray(record.emailSuffixes)) {
    return null;
  }
  return { emailAddresses: record.emailAddresses, emailSuffixes: record.emailSuffixes };
};

const isValidSuffix = (suffix: string): boolean => {
  const trimmed = suffix.trim();
  return trimmed.startsWith("@") && trimmed.length >= 2;
};

export const validateRecurringBookingTestBookerAllowlistSuffixes = (
  emailSuffixes: string[]
): RecurringBookingTestBookerAllowlistValidation =>
  emailSuffixes.some((suffix) => suffix.trim() !== "" && !isValidSuffix(suffix))
    ? { emailSuffixes: "invalidSuffix" }
    : {};

export const buildRecurringBookingTestBookerAllowlistValue = (
  emailAddresses: string[],
  emailSuffixes: string[]
): RecurringBookingTestBookerAllowlist | null => {
  const trimmedSuffixes = emailSuffixes.map((item) => item.trim()).filter((item) => item !== "");
  if (validateRecurringBookingTestBookerAllowlistSuffixes(trimmedSuffixes).emailSuffixes) {
    return null;
  }
  return {
    emailAddresses: emailAddresses.map((item) => item.trim()).filter((item) => item !== ""),
    emailSuffixes: trimmedSuffixes,
  };
};

export const resolveRecurringBookingTestBookerAllowlistSaveError = (
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
  return t("setting.form.validation.testBookerAllowlistRejected");
};
