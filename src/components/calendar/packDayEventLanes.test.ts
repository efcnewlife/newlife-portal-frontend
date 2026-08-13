import { describe, expect, it } from "vitest";
import { packDayEventLanes, type PackableEvent } from "./packDayEventLanes";

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

describe("packDayEventLanes", () => {
  it("returns no placements or overflow for an empty day", () => {
    expect(packDayEventLanes([], 4)).toEqual({ placements: [], overflows: [] });
  });

  it("gives a single event the full day column", () => {
    const { result, byId } = placementById([event("solo", 14, 16)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.solo).toEqual({
      id: "solo",
      laneIndex: 0,
      leftPercent: 0,
      widthPercent: 100,
    });
  });

  it("splits two overlapping events into equal 50/50 lanes", () => {
    const { result, byId } = placementById([event("a", 9, 11), event("b", 10, 12)], 4);
    expect(result.overflows).toEqual([]);
    expect(result.placements).toHaveLength(2);
    expect(byId.a).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 50 });
    expect(byId.b).toMatchObject({ laneIndex: 1, leftPercent: 50, widthPercent: 50 });
  });

  it("packs a chain of overlaps so C reuses A's lane after A ends", () => {
    const { result, byId } = placementById(
      [event("a", 9, 12), event("b", 11, 13), event("c", 12, 14, 30, 0)],
      4,
    );
    expect(result.overflows).toEqual([]);
    expect(byId.a.laneIndex).toBe(0);
    expect(byId.b.laneIndex).toBe(1);
    expect(byId.c.laneIndex).toBe(0);
    expect(byId.a.widthPercent).toBe(50);
    expect(byId.b.widthPercent).toBe(50);
    expect(byId.c.widthPercent).toBe(50);
  });

  it("treats back-to-back events as non-overlapping full-width blocks", () => {
    const { result, byId } = placementById([event("a", 9, 10), event("b", 10, 11)], 4);
    expect(result.overflows).toEqual([]);
    expect(byId.a).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
    expect(byId.b).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
  });

  it("keeps morning and afternoon collision groups on independent widths", () => {
    const { result, byId } = placementById(
      [event("morning-a", 9, 11), event("morning-b", 10, 12), event("afternoon", 15, 16)],
      4,
    );
    expect(result.overflows).toEqual([]);
    expect(byId["morning-a"].widthPercent).toBe(50);
    expect(byId["morning-b"].widthPercent).toBe(50);
    expect(byId.afternoon).toMatchObject({ laneIndex: 0, leftPercent: 0, widthPercent: 100 });
  });

  it("hides the 5th concurrent event when K is 4 and reports overflow 1", () => {
    const events = [
      event("a", 9, 15),
      event("b", 9, 14),
      event("c", 9, 13),
      event("d", 9, 12),
      event("e", 9, 11),
    ];
    const { result, byId } = placementById(events, 4);
    expect(result.placements).toHaveLength(4);
    expect(byId.e).toBeUndefined();
    expect(result.overflows).toHaveLength(1);
    expect(result.overflows[0].undrawnCount).toBe(1);
    expect(byId.a.widthPercent).toBe(25);
    expect(byId.b.widthPercent).toBe(25);
    expect(byId.c.widthPercent).toBe(25);
    expect(byId.d.widthPercent).toBe(25);
  });

  it("hides the 11th concurrent event when K is 10 and reports overflow 1", () => {
    const events = Array.from({ length: 11 }, (_, index) =>
      event(String.fromCharCode(97 + index), 9, 20 - index),
    );
    const { result } = placementById(events, 10);
    expect(result.placements).toHaveLength(10);
    expect(result.placements.every((placement) => placement.widthPercent === 10)).toBe(true);
    expect(result.overflows).toHaveLength(1);
    expect(result.overflows[0].undrawnCount).toBe(1);
    expect(result.placements.find((placement) => placement.id === "k")).toBeUndefined();
  });
});
