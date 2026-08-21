import { describe, expect, it } from "vitest";
import type { BookingListItem } from "@/api/services/facilityService";
import {
  DEFAULT_VIEWPORT_MINUTE,
  GRID_CELL_COUNT,
  GRID_CELL_MINUTES,
  GRID_DAY_MINUTES,
  clickIntervalForCell,
  formatGridCellStartLabel,
  formatGridHourLabel,
  gridHourLabels,
  layoutGridOccupancyBlocks,
  occupiedFacilityIds,
} from "./bookingGridLayout";

const at = (year: number, month: number, day: number, hour: number, minute = 0): Date =>
  new Date(year, month, day, hour, minute, 0, 0);

const booking = (
  overrides: Partial<BookingListItem> & Pick<BookingListItem, "id" | "startAt" | "endAt">
): BookingListItem => ({
  userId: "user-1",
  bookingType: "one_time",
  status: "confirmed",
  ...overrides,
});

describe("bookingGridLayout", () => {
  it("exposes 48 half-hour cells across a 24-hour day", () => {
    expect(GRID_CELL_MINUTES).toBe(30);
    expect(GRID_DAY_MINUTES).toBe(24 * 60);
    expect(GRID_CELL_COUNT).toBe(48);
    expect(DEFAULT_VIEWPORT_MINUTE).toBe(8 * 60);
  });

  it("maps the last cell to 11:30 PM–12:00 AM", () => {
    const day = at(2026, 7, 20, 0, 0);
    const interval = clickIntervalForCell(day, 47);
    expect(interval.start).toEqual(at(2026, 7, 20, 23, 30));
    expect(interval.end).toEqual(at(2026, 7, 21, 0, 0));
  });

  it("maps cell 0 to 12:00 AM–12:30 AM", () => {
    const day = at(2026, 7, 20, 0, 0);
    const interval = clickIntervalForCell(day, 0);
    expect(interval.start).toEqual(at(2026, 7, 20, 0, 0));
    expect(interval.end).toEqual(at(2026, 7, 20, 0, 30));
  });

  it("formats hour labels in 12-hour AM/PM with both ends 12:00 AM", () => {
    expect(formatGridHourLabel(0)).toBe("12:00 AM");
    expect(formatGridHourLabel(12)).toBe("12:00 PM");
    expect(formatGridHourLabel(13)).toBe("1:00 PM");
    expect(formatGridHourLabel(24)).toBe("12:00 AM");
    const labels = gridHourLabels();
    expect(labels).toHaveLength(25);
    expect(labels[0]).toBe("12:00 AM");
    expect(labels[24]).toBe("12:00 AM");
  });

  it("formats half-hour cell start labels for create targets", () => {
    expect(formatGridCellStartLabel(0)).toBe("12:00 AM");
    expect(formatGridCellStartLabel(21)).toBe("10:30 AM");
    expect(formatGridCellStartLabel(47)).toBe("11:30 PM");
  });

  it("places a continuous bar for unaligned start and end", () => {
    const day = at(2026, 7, 20, 0, 0);
    const roomId = "room-a";
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "b1",
          facilityIds: [roomId],
          startAt: at(2026, 7, 20, 10, 15).toISOString(),
          endAt: at(2026, 7, 20, 11, 45).toISOString(),
        }),
      ],
      [{ id: roomId }],
      day
    );
    const [block] = blocks.get(roomId) || [];
    expect(block).toBeDefined();
    expect(block.leftPercent).toBeCloseTo(((10 * 60 + 15) / GRID_DAY_MINUTES) * 100);
    expect(block.widthPercent).toBeCloseTo((90 / GRID_DAY_MINUTES) * 100);
  });

  it("clips occupancy at both midnights", () => {
    const day = at(2026, 7, 20, 0, 0);
    const roomId = "room-a";
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "overnight",
          facilityIds: [roomId],
          startAt: at(2026, 7, 19, 22, 0).toISOString(),
          endAt: at(2026, 7, 20, 2, 0).toISOString(),
        }),
      ],
      [{ id: roomId }],
      day
    );
    const [block] = blocks.get(roomId) || [];
    expect(block.leftPercent).toBe(0);
    expect(block.widthPercent).toBeCloseTo(((2 * 60) / GRID_DAY_MINUTES) * 100);
  });

  it("duplicates the same interval onto every facilityIds row", () => {
    const day = at(2026, 7, 20, 0, 0);
    const rooms = [{ id: "r1" }, { id: "r2" }, { id: "r3" }];
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "multi",
          facilityId: "r1",
          facilityIds: ["r1", "r2"],
          startAt: at(2026, 7, 20, 9, 0).toISOString(),
          endAt: at(2026, 7, 20, 10, 0).toISOString(),
        }),
      ],
      rooms,
      day
    );
    expect(blocks.get("r1")).toHaveLength(1);
    expect(blocks.get("r2")).toHaveLength(1);
    expect(blocks.get("r3")).toHaveLength(0);
    expect(blocks.get("r1")![0].leftPercent).toBe(blocks.get("r2")![0].leftPercent);
    expect(blocks.get("r1")![0].widthPercent).toBe(blocks.get("r2")![0].widthPercent);
  });

  it("falls back to Primary facilityId when facilityIds is missing", () => {
    expect(occupiedFacilityIds({ facilityId: "primary" })).toEqual(["primary"]);
    expect(occupiedFacilityIds({ facilityIds: [], facilityId: "primary" })).toEqual(["primary"]);
    expect(occupiedFacilityIds({ facilityIds: ["a", "b"], facilityId: "primary" })).toEqual(["a", "b"]);
  });

  it("omits cancelled bookings", () => {
    const day = at(2026, 7, 20, 0, 0);
    const roomId = "room-a";
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "cancelled",
          facilityIds: [roomId],
          status: "cancelled",
          startAt: at(2026, 7, 20, 9, 0).toISOString(),
          endAt: at(2026, 7, 20, 10, 0).toISOString(),
        }),
        booking({
          id: "draft",
          facilityIds: [roomId],
          status: "draft",
          startAt: at(2026, 7, 20, 11, 0).toISOString(),
          endAt: at(2026, 7, 20, 12, 0).toISOString(),
        }),
      ],
      [{ id: roomId }],
      day
    );
    const roomBlocks = blocks.get(roomId) || [];
    expect(roomBlocks.map((block) => block.booking.id)).toEqual(["draft"]);
  });

  it("stacks overlapping bookings on the same room into lanes", () => {
    const day = at(2026, 7, 20, 0, 0);
    const roomId = "room-a";
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "a",
          facilityIds: [roomId],
          startAt: at(2026, 7, 20, 9, 0).toISOString(),
          endAt: at(2026, 7, 20, 11, 0).toISOString(),
        }),
        booking({
          id: "b",
          facilityIds: [roomId],
          startAt: at(2026, 7, 20, 10, 0).toISOString(),
          endAt: at(2026, 7, 20, 12, 0).toISOString(),
        }),
      ],
      [{ id: roomId }],
      day
    );
    const roomBlocks = blocks.get(roomId) || [];
    expect(roomBlocks).toHaveLength(2);
    expect(new Set(roomBlocks.map((block) => block.lane)).size).toBe(2);
    expect(roomBlocks.every((block) => block.laneCount === 2)).toBe(true);
  });

  it("does not place bookings by facilityNames alone", () => {
    const day = at(2026, 7, 20, 0, 0);
    const blocks = layoutGridOccupancyBlocks(
      [
        booking({
          id: "names-only",
          facilityNames: ["Gym"],
          startAt: at(2026, 7, 20, 9, 0).toISOString(),
          endAt: at(2026, 7, 20, 10, 0).toISOString(),
        }),
      ],
      [{ id: "gym-id" }],
      day
    );
    expect(blocks.get("gym-id")).toEqual([]);
  });
});
