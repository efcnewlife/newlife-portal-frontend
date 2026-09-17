import { describe, expect, it } from "vitest";
import { bookingStatusBadgeColor, isOverriddenBookingStatus } from "./bookingStatusBadge";

describe("bookingStatusBadgeColor", () => {
  it.each([
    ["pending_payment", "warning"],
    ["confirmed", "success"],
    ["cancelled", "light"],
    ["overridden", "error"],
  ] as const)("maps %s to %s", (status, color) => {
    expect(bookingStatusBadgeColor(status)).toBe(color);
  });

  it("falls back to light for an unrecognized status", () => {
    expect(bookingStatusBadgeColor("draft")).toBe("light");
    expect(bookingStatusBadgeColor("something_unexpected")).toBe("light");
  });
});

describe("isOverriddenBookingStatus", () => {
  it("is true only for overridden", () => {
    expect(isOverriddenBookingStatus("overridden")).toBe(true);
    expect(isOverriddenBookingStatus("confirmed")).toBe(false);
    expect(isOverriddenBookingStatus("cancelled")).toBe(false);
  });
});
