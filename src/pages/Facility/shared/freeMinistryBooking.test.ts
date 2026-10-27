import { describe, expect, it } from "vitest";
import { isSavedFreeMinistryBooking } from "./freeMinistryBooking";

describe("isSavedFreeMinistryBooking", () => {
  it("treats a saved Ministry record with a zero total as a free Ministry booking", () => {
    expect(isSavedFreeMinistryBooking({ ministryId: "ministry-1", quotedAmount: "0.00" })).toBe(true);
    expect(isSavedFreeMinistryBooking({ ministryId: "ministry-1", quotedAmount: 0 })).toBe(true);
  });

  it("does not treat a zero-priced Personal record as a free Ministry booking", () => {
    expect(isSavedFreeMinistryBooking({ ministryId: null, quotedAmount: "0.00" })).toBe(false);
    expect(isSavedFreeMinistryBooking({ quotedAmount: "0.00" })).toBe(false);
  });

  it("does not treat a charged or unpriced Ministry record as free", () => {
    expect(isSavedFreeMinistryBooking({ ministryId: "ministry-1", quotedAmount: "120.00" })).toBe(false);
    expect(isSavedFreeMinistryBooking({ ministryId: "ministry-1", quotedAmount: null })).toBe(false);
    expect(isSavedFreeMinistryBooking({ ministryId: "ministry-1" })).toBe(false);
  });
});
