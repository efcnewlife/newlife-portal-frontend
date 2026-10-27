import { describe, expect, it } from "vitest";
import { buildDiscountEligibilityRequest, discountEligibilityDisplay } from "./discountEligibility";

describe("buildDiscountEligibilityRequest", () => {
  it("builds the admin preflight body from booking type, selected Ministry, and on-behalf Booker", () => {
    expect(
      buildDiscountEligibilityRequest({
        bookingType: "one_time",
        ministryId: "ministry-1",
        userId: "booker-1",
      })
    ).toEqual({
      bookingType: "one_time",
      ministryId: "ministry-1",
      userId: "booker-1",
    });
  });

  it("sends a Recurring proposal without a Ministry as ministryId null so the server can fall back", () => {
    expect(
      buildDiscountEligibilityRequest({
        bookingType: "recurring",
        ministryId: null,
        userId: "booker-1",
      })
    ).toEqual({
      bookingType: "recurring",
      ministryId: null,
      userId: "booker-1",
    });
  });

  it("treats a blank Ministry the same as none", () => {
    expect(
      buildDiscountEligibilityRequest({
        bookingType: "one_time",
        ministryId: "",
        userId: "booker-1",
      })?.ministryId
    ).toBeNull();
  });

  it("does not request eligibility until a Booker is selected", () => {
    expect(
      buildDiscountEligibilityRequest({
        bookingType: "one_time",
        ministryId: "ministry-1",
        userId: "",
      })
    ).toBeNull();
  });

  it("changes the request when Booker, Ministry, or booking type changes", () => {
    const base = {
      bookingType: "one_time" as const,
      ministryId: "ministry-1",
      userId: "booker-1",
    };
    expect(buildDiscountEligibilityRequest({ ...base, userId: "booker-2" })?.userId).toBe("booker-2");
    expect(buildDiscountEligibilityRequest({ ...base, ministryId: "ministry-2" })?.ministryId).toBe("ministry-2");
    expect(buildDiscountEligibilityRequest({ ...base, bookingType: "recurring" })?.bookingType).toBe("recurring");
  });
});

describe("discountEligibilityDisplay", () => {
  it("shows the fixed-free Ministry policy when the server says the proposal is a free Ministry booking", () => {
    expect(discountEligibilityDisplay({ discountCode: null, discountPercent: "0", isFreeMinistry: true })).toEqual({
      kind: "freeMinistry",
      discountCode: null,
      discountPercent: "0",
    });
  });

  it("never presents a Ministry percentage discount, even if a stale mission_aligned code arrives", () => {
    expect(
      discountEligibilityDisplay({ discountCode: "mission_aligned", discountPercent: "30", isFreeMinistry: true }).kind
    ).toBe("freeMinistry");
  });

  it("shows Recurring Discount when the server selected the Recurring fallback", () => {
    expect(
      discountEligibilityDisplay({
        discountCode: "recurring_weekly_monthly",
        discountPercent: 20,
        isFreeMinistry: false,
      })
    ).toEqual({
      kind: "recurring",
      discountCode: "recurring_weekly_monthly",
      discountPercent: "20",
    });
  });

  it("shows no discount when the server selected none", () => {
    expect(discountEligibilityDisplay({ discountCode: null, discountPercent: "0", isFreeMinistry: false })).toEqual({
      kind: "none",
      discountCode: null,
      discountPercent: "0",
    });
  });

  it("shows no discount before a preflight result exists", () => {
    expect(discountEligibilityDisplay(null)).toEqual({
      kind: "none",
      discountCode: null,
      discountPercent: "0",
    });
  });

  it("still shows the server percent when the discount code is not one of the known catalog values", () => {
    expect(
      discountEligibilityDisplay({ discountCode: "custom_rule", discountPercent: "15", isFreeMinistry: false })
    ).toEqual({
      kind: "applied",
      discountCode: "custom_rule",
      discountPercent: "15",
    });
  });
});
