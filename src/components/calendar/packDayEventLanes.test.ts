import { describe, expect, it } from "vitest";
import {
  OVERLAY_INDENT_RATIO,
  OVERLAY_MIN_WIDTH_RATIO,
  packDayEventLanes,
  type EventLanePlacement,
  type PackableEvent,
} from "./packDayEventLanes";

const at = (hour: number, minute = 0): Date => new Date(2026, 7, 13, hour, minute, 0, 0);

const event = (id: string, startHour: number, endHour: number, startMinute = 0, endMinute = 0): PackableEvent => ({
  id,
  start: at(startHour, startMinute),
  end: at(endHour, endMinute),
});

const placementById = (events: PackableEvent[], maxLaneCount: number) => {
  const result = packDayEventLanes(events, maxLaneCount);
  return {
    result,
    byId: Object.fromEntries(result.placements.map((placement) => [placement.id, placement])),
  };
};

const rightEdge = (placement: EventLanePlacement): number => placement.leftPercent + placement.widthPercent;

const expectedOverlay = (laneIndex: number) => {
  const leftPercent = Math.min(laneIndex * OVERLAY_INDENT_RATIO, 1 - OVERLAY_MIN_WIDTH_RATIO) * 100;
  return { leftPercent, widthPercent: 100 - leftPercent };
};

describe("packDayEventLanes", () => {
  it("returns no placements or overflow for an empty day", () => {
    expect(packDayEventLanes([], 4)).toEqual({ placements: [], overflows: [] });
  });

  it("gives a single event the full day column", () => {
    const { result, byId } = placementById([event("solo", 14, 16)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.solo).toMatchObject({
      id: "solo",
      laneIndex: 0,
      leftPercent: 0,
      widthPercent: 100,
    });
  });

  it("overlays a later event with a slight indent on a full-width earlier event", () => {
    const { result, byId } = placementById([event("a", 9, 12), event("b", 10, 11)], 4);
    expect(result.overflows).toEqual([]);
    expect(result.placements).toHaveLength(2);
    expect(byId.a).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
    expect(byId.b).toMatchObject({ laneIndex: 1, ...expectedOverlay(1) });
    expect(rightEdge(byId.b)).toBeCloseTo(100);
  });

  it("keeps a long event full width and stacks back-to-back shorts in the same overlay column", () => {
    const { result, byId } = placementById([event("long", 13, 16, 35, 35), event("mid", 15, 16, 0, 30), event("tail", 16, 18, 30, 0)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.long).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
    expect(byId.mid.laneIndex).toBe(1);
    expect(byId.tail.laneIndex).toBe(1);
    expect(byId.mid).toMatchObject(expectedOverlay(1));
    expect(byId.tail).toMatchObject(expectedOverlay(1));
    expect(rightEdge(byId.mid)).toBeCloseTo(100);
    expect(rightEdge(byId.tail)).toBeCloseTo(100);
  });

  it("stacks dense concurrent events as a right-aligned card stack with full-width base", () => {
    const events = [
      event("base", 19, 22),
      event("t1", 20, 21, 30, 0),
      event("t2", 20, 21, 30, 0),
      event("t3", 20, 21, 30, 0),
      event("t4", 20, 21, 30, 0),
      event("t5", 20, 21, 30, 0),
      event("later", 21, 22),
    ];
    const { result, byId } = placementById(events, 10);
    expect(result.overflows).toEqual([]);
    expect(byId.base).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
    expect(byId.t1.laneIndex).toBe(1);
    expect(byId.t5.laneIndex).toBe(5);
    expect(byId.later.laneIndex).toBe(1);
    expect(byId.t1.leftPercent).toBeLessThan(byId.t5.leftPercent);
    expect(byId.t5.widthPercent).toBeLessThan(byId.t1.widthPercent);
    expect(rightEdge(byId.t1)).toBeCloseTo(100);
    expect(rightEdge(byId.t5)).toBeCloseTo(100);
    expect(rightEdge(byId.later)).toBeCloseTo(100);
    expect(byId.later).toMatchObject(expectedOverlay(1));
  });

  it("packs a chain of partial overlaps so C reuses A's lane after A ends", () => {
    const { result, byId } = placementById([event("a", 9, 12), event("b", 11, 13), event("c", 12, 14, 30, 0)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.a.laneIndex).toBe(0);
    expect(byId.b.laneIndex).toBe(1);
    expect(byId.c.laneIndex).toBe(0);
    expect(byId.a).toMatchObject({ leftPercent: 0, widthPercent: 100 });
    expect(byId.b).toMatchObject(expectedOverlay(1));
    expect(byId.c).toMatchObject({ leftPercent: 0, widthPercent: 100 });
  });

  it("treats back-to-back events as non-overlapping full-width blocks", () => {
    const { result, byId } = placementById([event("a", 9, 10), event("b", 10, 11)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.a).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
    expect(byId.b).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
  });

  it("keeps morning and afternoon collision groups on independent widths", () => {
    const { result, byId } = placementById([event("morning-a", 9, 11), event("morning-b", 10, 12), event("afternoon", 15, 16)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId["morning-a"]).toMatchObject({ leftPercent: 0, widthPercent: 100 });
    expect(byId["morning-b"]).toMatchObject(expectedOverlay(1));
    expect(byId.afternoon).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
  });

  it("hides the 5th concurrent event when K is 4 and reports overflow 1", () => {
    const events = [event("a", 9, 11), event("b", 9, 11), event("c", 9, 11), event("d", 9, 11), event("e", 9, 11)];
    const { result, byId } = placementById(events, 4);
    expect(result.placements).toHaveLength(4);
    expect(byId.e).toBeUndefined();
    expect(result.overflows).toHaveLength(1);
    expect(result.overflows[0].undrawnCount).toBe(1);
    expect(byId.a).toMatchObject(expectedOverlay(0));
    expect(byId.b).toMatchObject(expectedOverlay(1));
    expect(byId.c).toMatchObject(expectedOverlay(2));
    expect(byId.d).toMatchObject(expectedOverlay(3));
  });

  it("hides the 11th concurrent event when K is 10 and reports overflow 1", () => {
    const events = Array.from({ length: 11 }, (_, index) => event(String.fromCharCode(97 + index), 9, 11));
    const { result } = placementById(events, 10);
    expect(result.placements).toHaveLength(10);
    expect(result.overflows).toHaveLength(1);
    expect(result.overflows[0].undrawnCount).toBe(1);
    expect(result.placements.find((placement) => placement.id === "k")).toBeUndefined();
    result.placements.forEach((placement) => {
      expect(placement).toMatchObject(expectedOverlay(placement.laneIndex));
      expect(rightEdge(placement)).toBeCloseTo(100);
    });
  });
});
