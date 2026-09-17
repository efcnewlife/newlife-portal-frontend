import { describe, expect, it } from "vitest";
import type { RoomBlackoutImpactOccurrence, RoomBlackoutWrite } from "@/api/services/facilityService";
import {
  buildConfirmedBlackoutPayload,
  groupBlackoutImpactBySeries,
  isMinistrySeriesImpact,
  resolveRoomBlackoutImpactErrorMessage,
  ROOM_BLACKOUT_IMPACT_ERROR_CODE,
} from "./roomBlackoutImpact";

const occurrence = (overrides: Partial<RoomBlackoutImpactOccurrence>): RoomBlackoutImpactOccurrence => ({
  id: "occ-1",
  seriesId: "series-1",
  startAt: "2026-01-04T09:00:00Z",
  endAt: "2026-01-04T11:00:00Z",
  status: "confirmed",
  facilityIds: ["room-1"],
  ministryId: null,
  ...overrides,
});

const t = (key: string) => key;

describe("groupBlackoutImpactBySeries", () => {
  it("returns no groups for a no-impact (empty) preview", () => {
    expect(groupBlackoutImpactBySeries([])).toEqual([]);
  });

  it("groups impacted occurrences by Series, ordering groups and occurrences ascending", () => {
    const items = [
      occurrence({ id: "occ-2", seriesId: "series-2", startAt: "2026-01-05T09:00:00Z" }),
      occurrence({ id: "occ-1a", seriesId: "series-1", startAt: "2026-01-18T09:00:00Z" }),
      occurrence({ id: "occ-1b", seriesId: "series-1", startAt: "2026-01-04T09:00:00Z" }),
    ];
    const groups = groupBlackoutImpactBySeries(items);
    expect(groups.map((g) => g.seriesId)).toEqual(["series-1", "series-2"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["occ-1b", "occ-1a"]);
  });
});

describe("isMinistrySeriesImpact", () => {
  it("is true when ministryId is present", () => {
    expect(isMinistrySeriesImpact(occurrence({ ministryId: "ministry-1" }))).toBe(true);
  });

  it("is false for a Personal Rental (ministryId null)", () => {
    expect(isMinistrySeriesImpact(occurrence({ ministryId: null }))).toBe(false);
  });
});

describe("buildConfirmedBlackoutPayload", () => {
  it("attaches confirmOccurrenceIds matching the previewed impact items, leaving other fields untouched", () => {
    const payload: RoomBlackoutWrite = {
      facilityId: "room-1",
      name: "Roof repair",
      reason: "Contractor access",
      kind: "one_off",
      blackoutDate: "2026-01-04",
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    };
    const items = [occurrence({ id: "occ-1" }), occurrence({ id: "occ-2" })];
    const confirmed = buildConfirmedBlackoutPayload(payload, items);
    expect(confirmed).toEqual({ ...payload, confirmOccurrenceIds: ["occ-1", "occ-2"] });
  });

  it("confirms an empty set for a no-impact preview", () => {
    const payload: RoomBlackoutWrite = {
      facilityId: null,
      name: "Holiday closure",
      reason: "Campus closed",
      kind: "one_off",
      blackoutDate: "2026-12-25",
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    };
    expect(buildConfirmedBlackoutPayload(payload, [])).toEqual({ ...payload, confirmOccurrenceIds: [] });
  });
});

describe("resolveRoomBlackoutImpactErrorMessage", () => {
  it("maps CONFIRMATION_REQUIRED to the stale-impact message", () => {
    const error = {
      code: 400,
      message: "bad request",
      details: { error_code: ROOM_BLACKOUT_IMPACT_ERROR_CODE.CONFIRMATION_REQUIRED },
    };
    expect(resolveRoomBlackoutImpactErrorMessage(error, t)).toBe("roomBlackout.impact.errors.stale");
  });

  it("maps MISMATCH to the stale-impact message", () => {
    const error = {
      code: 400,
      message: "bad request",
      details: { error_code: ROOM_BLACKOUT_IMPACT_ERROR_CODE.MISMATCH },
    };
    expect(resolveRoomBlackoutImpactErrorMessage(error, t)).toBe("roomBlackout.impact.errors.stale");
  });

  it("returns undefined for an unmapped error code", () => {
    const error = { code: 400, message: "bad request", details: { error_code: "FACILITY_BLACKOUT_NOT_FOUND" } };
    expect(resolveRoomBlackoutImpactErrorMessage(error, t)).toBeUndefined();
  });

  it("returns undefined for a non-ApiError value", () => {
    expect(resolveRoomBlackoutImpactErrorMessage(new Error("network down"), t)).toBeUndefined();
  });
});
