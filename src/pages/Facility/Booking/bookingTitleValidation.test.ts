import { describe, expect, it } from "vitest";
import { BOOKING_TITLE_MAX_LENGTH, validateBookingTitle } from "./bookingTitleValidation";

describe("validateBookingTitle", () => {
  it("accepts a trimmed plain-text title within range", () => {
    expect(validateBookingTitle("  Sunday rehearsal  ")).toBeNull();
  });

  it("rejects an empty or whitespace-only title", () => {
    expect(validateBookingTitle("")).toBe("required");
    expect(validateBookingTitle("   ")).toBe("required");
  });

  it("rejects a title longer than the max length", () => {
    const tooLong = "a".repeat(BOOKING_TITLE_MAX_LENGTH + 1);
    expect(validateBookingTitle(tooLong)).toBe("tooLong");
  });

  it("accepts a title at exactly the max length", () => {
    const exact = "a".repeat(BOOKING_TITLE_MAX_LENGTH);
    expect(validateBookingTitle(exact)).toBeNull();
  });

  it("rejects a title containing HTML markup", () => {
    expect(validateBookingTitle("<b>Rehearsal</b>")).toBe("notPlainText");
  });
});
