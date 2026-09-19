import { describe, expect, it } from "vitest";
import { buildBookingUpdatePayload } from "./bookingUpdatePayload";

describe("buildBookingUpdatePayload", () => {
  it("builds the constrained update payload: title, Ministry, and surcharge selection", () => {
    const payload = buildBookingUpdatePayload({
      title: "  Sunday rehearsal  ",
      ministryId: "ministry-1",
      surchargeCodes: ["cleaning"],
    });
    expect(payload).toEqual({
      title: "Sunday rehearsal",
      ministryId: "ministry-1",
      surchargeCodes: ["cleaning"],
    });
  });

  it("omits ministryId when it is blank", () => {
    const payload = buildBookingUpdatePayload({
      title: "Rehearsal",
      ministryId: null,
      surchargeCodes: [],
    });
    expect(payload.ministryId).toBeUndefined();
  });

  it("never carries Room or time fields, since the update contract does not accept them", () => {
    const payload = buildBookingUpdatePayload({
      title: "Rehearsal",
      ministryId: null,
      surchargeCodes: [],
    });
    expect(payload).not.toHaveProperty("startAt");
    expect(payload).not.toHaveProperty("endAt");
    expect(payload).not.toHaveProperty("rooms");
    expect(payload).not.toHaveProperty("facilityIds");
  });
});
