import type { ApiError } from "@/types/api";
import { describe, expect, it } from "vitest";
import {
  buildRecurringBookingTestBookerAllowlistValue,
  isRecurringBookingTestBookerAllowlistSetting,
  isRecurringBookingTestWindowOverrideSetting,
  parseRecurringBookingTestBookerAllowlist,
  resolveRecurringBookingTestBookerAllowlistSaveError,
  validateRecurringBookingTestBookerAllowlistSuffixes,
} from "./recurringBookingTestControls";

const t = (key: string): string => key;

const apiError = (overrides: Partial<ApiError> = {}): ApiError => ({
  code: 400,
  message: "emailSuffixes entries must begin with '@' and name a complete domain",
  ...overrides,
});

describe("Recurring Booking test control setting identity", () => {
  it("matches the Core API facility test-window-override setting key", () => {
    expect(isRecurringBookingTestWindowOverrideSetting("facility", "recurring_booking_test_window_override")).toBe(
      true
    );
    expect(isRecurringBookingTestWindowOverrideSetting("facility", "timezone")).toBe(false);
    expect(isRecurringBookingTestWindowOverrideSetting("system", "recurring_booking_test_window_override")).toBe(false);
  });

  it("matches the Core API facility test-booker-allowlist setting key", () => {
    expect(isRecurringBookingTestBookerAllowlistSetting("facility", "recurring_booking_test_booker_allowlist")).toBe(
      true
    );
    expect(isRecurringBookingTestBookerAllowlistSetting("facility", "timezone")).toBe(false);
    expect(isRecurringBookingTestBookerAllowlistSetting("system", "recurring_booking_test_booker_allowlist")).toBe(
      false
    );
  });
});

describe("Recurring Booking test Booker allowlist saved representation", () => {
  it("reloads a Core API value into the editor", () => {
    expect(
      parseRecurringBookingTestBookerAllowlist({
        emailAddresses: ["qa@example.com"],
        emailSuffixes: ["@stg.example.com"],
      })
    ).toEqual({ emailAddresses: ["qa@example.com"], emailSuffixes: ["@stg.example.com"] });
  });

  it("reloads the seeded empty allowlist", () => {
    expect(parseRecurringBookingTestBookerAllowlist({ emailAddresses: [], emailSuffixes: [] })).toEqual({
      emailAddresses: [],
      emailSuffixes: [],
    });
  });

  it("does not parse a missing or malformed stored value", () => {
    expect(parseRecurringBookingTestBookerAllowlist(null)).toBeNull();
    expect(parseRecurringBookingTestBookerAllowlist([])).toBeNull();
    expect(parseRecurringBookingTestBookerAllowlist({ emailAddresses: ["a@b.com"] })).toBeNull();
    expect(parseRecurringBookingTestBookerAllowlist({ emailAddresses: [1], emailSuffixes: [] })).toBeNull();
  });

  it("trims entries and drops blank rows when building the saved value", () => {
    expect(buildRecurringBookingTestBookerAllowlistValue([" qa@example.com ", ""], ["@stg.example.com", "  "])).toEqual(
      {
        emailAddresses: ["qa@example.com"],
        emailSuffixes: ["@stg.example.com"],
      }
    );
  });

  it("saves an empty allowlist when every row is blank", () => {
    expect(buildRecurringBookingTestBookerAllowlistValue([""], [""])).toEqual({
      emailAddresses: [],
      emailSuffixes: [],
    });
  });

  it("does not build a value when a suffix is invalid", () => {
    expect(buildRecurringBookingTestBookerAllowlistValue(["qa@example.com"], ["example.com"])).toBeNull();
    expect(buildRecurringBookingTestBookerAllowlistValue([], ["@"])).toBeNull();
  });
});

describe("Recurring Booking test Booker allowlist validation", () => {
  it("accepts suffixes that begin with @ and name a domain", () => {
    expect(validateRecurringBookingTestBookerAllowlistSuffixes(["@example.com", "@stg.example.com"])).toEqual({});
  });

  it("ignores blank suffix rows", () => {
    expect(validateRecurringBookingTestBookerAllowlistSuffixes(["@example.com", "", "  "])).toEqual({});
  });

  it("rejects a suffix missing the leading @", () => {
    expect(validateRecurringBookingTestBookerAllowlistSuffixes(["example.com"])).toEqual({
      emailSuffixes: "invalidSuffix",
    });
  });

  it("rejects a suffix that is only @", () => {
    expect(validateRecurringBookingTestBookerAllowlistSuffixes(["@"])).toEqual({
      emailSuffixes: "invalidSuffix",
    });
  });
});

describe("Recurring Booking test Booker allowlist API rejection", () => {
  it("maps a 400 without error_code to dedicated save feedback", () => {
    expect(resolveRecurringBookingTestBookerAllowlistSaveError(apiError(), t)).toBe(
      "setting.form.validation.testBookerAllowlistRejected"
    );
  });

  it("leaves mapped setting error_codes to the shared Operation feedback mapper", () => {
    expect(
      resolveRecurringBookingTestBookerAllowlistSaveError(
        apiError({ code: 404, details: { error_code: "SYSTEM_SETTING_NOT_FOUND" } }),
        t
      )
    ).toBeUndefined();
  });

  it("returns undefined for non-ApiError values", () => {
    expect(resolveRecurringBookingTestBookerAllowlistSaveError(new Error("boom"), t)).toBeUndefined();
  });
});
