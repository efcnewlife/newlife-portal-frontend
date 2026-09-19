import { describe, expect, it } from "vitest";
import { buildOneTimeBookingCreatePayload, buildOneTimePreviewQuoteRequest } from "./bookingCreatePayload";

describe("buildOneTimeBookingCreatePayload", () => {
  it("builds the create payload without a client-controlled isMissionAligned flag", () => {
    const payload = buildOneTimeBookingCreatePayload({
      userId: "booker-1",
      title: "  Sunday Rehearsal  ",
      startAt: "2026-01-04T14:00:00.000Z",
      endAt: "2026-01-04T16:00:00.000Z",
      ministryId: "ministry-1",
      facilityIds: ["room-1", "room-2"],
      surchargeCodes: ["cleaning"],
      remark: "  sunday rehearsal  ",
    });
    expect(payload).toEqual({
      userId: "booker-1",
      title: "Sunday Rehearsal",
      startAt: "2026-01-04T14:00:00.000Z",
      endAt: "2026-01-04T16:00:00.000Z",
      ministryId: "ministry-1",
      rooms: [
        { facilityId: "room-1", sequence: 0 },
        { facilityId: "room-2", sequence: 1 },
      ],
      surchargeCodes: ["cleaning"],
      remark: "sunday rehearsal",
    });
    expect(payload).not.toHaveProperty("isMissionAligned");
  });

  it("omits ministryId and remark when they are blank", () => {
    const payload = buildOneTimeBookingCreatePayload({
      userId: "booker-1",
      title: "Sunday Rehearsal",
      startAt: "2026-01-04T14:00:00.000Z",
      endAt: "2026-01-04T16:00:00.000Z",
      ministryId: null,
      facilityIds: ["room-1"],
      surchargeCodes: [],
      remark: "   ",
    });
    expect(payload.ministryId).toBeUndefined();
    expect(payload.remark).toBeUndefined();
  });
});

describe("buildOneTimePreviewQuoteRequest", () => {
  it("includes Booker and Ministry so the server can resolve the discount", () => {
    expect(
      buildOneTimePreviewQuoteRequest({
        userId: "booker-1",
        ministryId: "ministry-1",
        facilityIds: ["room-1"],
        billedHours: 2,
        surchargeCodes: ["cleaning"],
      })
    ).toEqual({
      bookingType: "one_time",
      userId: "booker-1",
      ministryId: "ministry-1",
      currency: "CAD",
      roomLines: [{ facilityId: "room-1", billedHours: 2 }],
      surchargeCodes: ["cleaning"],
    });
  });

  it("does not send a client-controlled isMissionAligned flag", () => {
    const payload = buildOneTimePreviewQuoteRequest({
      userId: "booker-1",
      ministryId: null,
      facilityIds: ["room-1"],
      billedHours: 1,
      surchargeCodes: [],
    });
    expect(payload).not.toHaveProperty("isMissionAligned");
  });

  it("returns null when rooms or billed hours are not ready", () => {
    expect(
      buildOneTimePreviewQuoteRequest({
        userId: "booker-1",
        ministryId: null,
        facilityIds: [],
        billedHours: 2,
        surchargeCodes: [],
      })
    ).toBeNull();
    expect(
      buildOneTimePreviewQuoteRequest({
        userId: "booker-1",
        ministryId: null,
        facilityIds: ["room-1"],
        billedHours: 0,
        surchargeCodes: [],
      })
    ).toBeNull();
  });
});
