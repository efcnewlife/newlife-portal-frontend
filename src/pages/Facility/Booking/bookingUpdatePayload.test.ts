import { describe, expect, it } from "vitest";
import { buildBookingUpdatePayload } from "./bookingUpdatePayload";

describe("buildBookingUpdatePayload", () => {
  it("builds the constrained update payload: title and surcharge selection", () => {
    const payload = buildBookingUpdatePayload({
      title: "  Sunday rehearsal  ",
      surchargeCodes: ["cleaning"],
    });
    expect(payload).toEqual({
      title: "Sunday rehearsal",
      surchargeCodes: ["cleaning"],
    });
  });

  it("never carries the Ministry association, which is immutable after creation", () => {
    const payload = buildBookingUpdatePayload({ title: "Rehearsal", surchargeCodes: [] });
    expect(payload).not.toHaveProperty("ministryId");
  });

  it("never carries Room or time fields, since the update contract does not accept them", () => {
    const payload = buildBookingUpdatePayload({ title: "Rehearsal", surchargeCodes: [] });
    expect(payload).not.toHaveProperty("startAt");
    expect(payload).not.toHaveProperty("endAt");
    expect(payload).not.toHaveProperty("rooms");
    expect(payload).not.toHaveProperty("facilityIds");
  });
});
