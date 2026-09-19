import { describe, expect, it } from "vitest";
import {
  buildRecurringSeriesCreatePayload,
  buildRecurringSeriesPreviewPayload,
  type RecurringSeriesPayloadInput,
} from "./recurringSeriesPayload";

const validInput = (overrides: Partial<RecurringSeriesPayloadInput> = {}): RecurringSeriesPayloadInput => ({
  userId: "booker-1",
  ministryId: null,
  firstOccurrenceDate: "2026-01-04",
  lastOccurrenceDate: "2026-01-25",
  localStartTime: "09:00:00",
  localEndTime: "11:00:00",
  facilityIds: ["room-1", "room-2"],
  surchargeCodes: ["cleaning"],
  remark: "  weekly youth group  ",
  ...overrides,
});

describe("buildRecurringSeriesPreviewPayload", () => {
  it("builds the payload for a fully filled-in form, preserving the Booker as userId (not the acting operator)", () => {
    const payload = buildRecurringSeriesPreviewPayload(validInput());
    expect(payload).toEqual({
      userId: "booker-1",
      ministryId: null,
      firstOccurrenceDate: "2026-01-04",
      lastOccurrenceDate: "2026-01-25",
      localStartTime: "09:00:00",
      localEndTime: "11:00:00",
      rooms: [
        { facilityId: "room-1", sequence: 0 },
        { facilityId: "room-2", sequence: 1 },
      ],
      surchargeCodes: ["cleaning"],
      remark: "weekly youth group",
    });
  });

  it("carries the selected Ministry id through unchanged", () => {
    const payload = buildRecurringSeriesPreviewPayload(validInput({ ministryId: "ministry-1" }));
    expect(payload?.ministryId).toBe("ministry-1");
  });

  it("omits remark when it is blank after trimming", () => {
    const payload = buildRecurringSeriesPreviewPayload(validInput({ remark: "   " }));
    expect(payload?.remark).toBeUndefined();
  });

  it("does not send a client-controlled isMissionAligned flag", () => {
    const payload = buildRecurringSeriesPreviewPayload(validInput());
    expect(payload).not.toHaveProperty("isMissionAligned");
  });

  const missingFieldCases: Array<[string, Partial<RecurringSeriesPayloadInput>]> = [
    ["userId", { userId: "" }],
    ["firstOccurrenceDate", { firstOccurrenceDate: null }],
    ["lastOccurrenceDate", { lastOccurrenceDate: null }],
    ["localStartTime", { localStartTime: null }],
    ["localEndTime", { localEndTime: null }],
    ["facilityIds", { facilityIds: [] }],
  ];

  it.each(missingFieldCases)("returns null when %s is missing", (_field, overrides) => {
    expect(buildRecurringSeriesPreviewPayload(validInput(overrides))).toBeNull();
  });
});

describe("buildRecurringSeriesCreatePayload", () => {
  it("merges the title (trimmed) and excludedDates onto the preview payload, leaving it otherwise unchanged", () => {
    const previewPayload = buildRecurringSeriesPreviewPayload(validInput())!;
    const payload = buildRecurringSeriesCreatePayload(previewPayload, "  Youth Group  ", ["2026-01-11"]);
    expect(payload).toEqual({
      ...previewPayload,
      title: "Youth Group",
      excludedDates: ["2026-01-11"],
    });
  });
});
