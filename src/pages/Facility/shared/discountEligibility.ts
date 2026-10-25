export type DiscountEligibilityBookingType = "one_time" | "recurring";

export interface DiscountEligibilityRequest {
  bookingType: DiscountEligibilityBookingType;
  ministryId: string | null;
  userId: string;
}

export interface DiscountEligibilityResult {
  discountCode: string | null;
  discountPercent: string | number;
  isFreeMinistry: boolean;
}

export type DiscountEligibilityKind = "freeMinistry" | "recurring" | "applied" | "none";

export interface DiscountEligibilityDisplay {
  kind: DiscountEligibilityKind;
  discountCode: string | null;
  discountPercent: string;
}

export const RECURRING_DISCOUNT_CODE = "recurring_weekly_monthly";

/**
 * Builds the admin Booking Discount Eligibility preflight body.
 * Returns null when Booker is missing so the caller skips the request
 * instead of treating an empty result as a locked quote.
 */
export const buildDiscountEligibilityRequest = (
  input: DiscountEligibilityRequest
): DiscountEligibilityRequest | null => {
  if (!input.userId) return null;
  return {
    bookingType: input.bookingType,
    ministryId: input.ministryId || null,
    userId: input.userId,
  };
};

const percentString = (value: string | number): string => String(value);

export const discountEligibilityDisplay = (result: DiscountEligibilityResult | null): DiscountEligibilityDisplay => {
  if (result == null) {
    return { kind: "none", discountCode: null, discountPercent: "0" };
  }
  // ADR 0037: an eligible Ministry booking is free, never a percentage discount.
  if (result.isFreeMinistry) {
    return { kind: "freeMinistry", discountCode: null, discountPercent: "0" };
  }
  const discountPercent = percentString(result.discountPercent);
  if (result.discountCode === RECURRING_DISCOUNT_CODE) {
    return { kind: "recurring", discountCode: result.discountCode, discountPercent };
  }
  if (!result.discountCode) {
    return { kind: "none", discountCode: null, discountPercent };
  }
  return { kind: "applied", discountCode: result.discountCode, discountPercent };
};
