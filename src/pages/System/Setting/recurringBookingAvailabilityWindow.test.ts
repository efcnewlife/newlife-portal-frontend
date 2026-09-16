import type { ApiError } from "@/types/api";
import { describe, expect, it } from "vitest";
import {
  buildRecurringBookingAvailabilityWindowValue,
  isRecurringBookingAvailabilityWindowSetting,
  parseRecurringBookingAvailabilityWindow,
  RECURRING_AVAILABILITY_UNITS,
  resolveRecurringBookingAvailabilityWindowSaveError,
  validateRecurringBookingAvailabilityWindow,
} from "./recurringBookingAvailabilityWindow";

const t = (key: string): string => key;

const apiError = (overrides: Partial<ApiError> = {}): ApiError => ({
  code: 400,
  message: "unit must be days, weeks, or months",
  ...overrides,
});

describe("Recurring Booking availability window setting identity", () => {
  it("matches the Core API facility setting key", () => {
    expect(isRecurringBookingAvailabilityWindowSetting("facility", "recurring_booking_availability_window")).toBe(true);
    expect(isRecurringBookingAvailabilityWindowSetting("facility", "timezone")).toBe(false);
    expect(isRecurringBookingAvailabilityWindowSetting("system", "recurring_booking_availability_window")).toBe(false);
  });
});

describe("Recurring Booking availability window saved representation", () => {
  it("exposes days, weeks, and calendar-relative months", () => {
    expect(RECURRING_AVAILABILITY_UNITS).toEqual(["days", "weeks", "months"]);
  });

  it.each([
    { amount: "10", unit: "days", saved: { amount: 10, unit: "days" } },
    { amount: "4", unit: "weeks", saved: { amount: 4, unit: "weeks" } },
    { amount: "1", unit: "months", saved: { amount: 1, unit: "months" } },
  ] as const)("saves a positive $unit amount as {amount, unit}", ({ amount, unit, saved }) => {
    expect(buildRecurringBookingAvailabilityWindowValue(amount, unit)).toEqual(saved);
  });

  it.each([
    { amount: 10, unit: "days" },
    { amount: 4, unit: "weeks" },
    { amount: 1, unit: "months" },
  ] as const)("reloads a $unit Core API value into the editor", ({ amount, unit }) => {
    expect(parseRecurringBookingAvailabilityWindow({ amount, unit })).toEqual({ amount, unit });
  });

  it("does not build a value when amount or unit is invalid", () => {
    expect(buildRecurringBookingAvailabilityWindowValue("", "weeks")).toBeNull();
    expect(buildRecurringBookingAvailabilityWindowValue("0", "weeks")).toBeNull();
    expect(buildRecurringBookingAvailabilityWindowValue("4", "hours")).toBeNull();
  });

  it("does not parse a missing or malformed stored value", () => {
    expect(parseRecurringBookingAvailabilityWindow(null)).toBeNull();
    expect(parseRecurringBookingAvailabilityWindow({ amount: 4 })).toBeNull();
    expect(parseRecurringBookingAvailabilityWindow({ amount: 0, unit: "weeks" })).toBeNull();
    expect(parseRecurringBookingAvailabilityWindow({ amount: 4, unit: "hours" })).toBeNull();
  });
});

describe("Recurring Booking availability window validation", () => {
  it("requires a positive integer amount and a supported unit", () => {
    expect(validateRecurringBookingAvailabilityWindow("4", "weeks")).toEqual({});
    expect(validateRecurringBookingAvailabilityWindow("", "")).toEqual({
      amount: "required",
      unit: "required",
    });
    expect(validateRecurringBookingAvailabilityWindow("0", "hours")).toEqual({
      amount: "invalid",
      unit: "invalid",
    });
    expect(validateRecurringBookingAvailabilityWindow("1.5", "weeks")).toEqual({
      amount: "invalid",
    });
  });
});

describe("Recurring Booking availability window API rejection", () => {
  it("maps a 400 without error_code to dedicated save feedback", () => {
    expect(resolveRecurringBookingAvailabilityWindowSaveError(apiError(), t)).toBe(
      "setting.form.validation.availabilityWindowRejected"
    );
  });

  it("leaves mapped setting error_codes to the shared Operation feedback mapper", () => {
    expect(
      resolveRecurringBookingAvailabilityWindowSaveError(
        apiError({
          code: 404,
          details: { error_code: "SYSTEM_SETTING_NOT_FOUND" },
        }),
        t
      )
    ).toBeUndefined();
  });

  it("returns undefined for non-ApiError values", () => {
    expect(resolveRecurringBookingAvailabilityWindowSaveError(new Error("boom"), t)).toBeUndefined();
  });
});
