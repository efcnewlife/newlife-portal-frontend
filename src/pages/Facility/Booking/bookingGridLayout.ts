import type { BookingListItem } from "@/api/services/facilityService";

export const GRID_CELL_MINUTES = 30;
export const GRID_DAY_MINUTES = 24 * 60;
export const GRID_CELL_COUNT = GRID_DAY_MINUTES / GRID_CELL_MINUTES;
export const DEFAULT_VIEWPORT_MINUTE = 8 * 60;

export interface GridOccupancyBlock {
  booking: BookingListItem;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
  lane: number;
  laneCount: number;
}

export interface ClickInterval {
  start: Date;
  end: Date;
}

const startOfLocalDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addMinutes = (date: Date, minutes: number): Date => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

export const formatGridHourLabel = (hour: number): string => {
  if (hour === 24) return "12:00 AM";
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized < 12 ? "AM" : "PM";
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${display}:00 ${period}`;
};

export const formatGridCellStartLabel = (cellIndex: number): string => {
  const clamped = Math.max(0, Math.min(GRID_CELL_COUNT - 1, cellIndex));
  const totalMinutes = clamped * GRID_CELL_MINUTES;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 < 12 ? "AM" : "PM";
  const display = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${display}:${String(minute).padStart(2, "0")} ${period}`;
};

export const gridHourLabels = (): string[] => Array.from({ length: 25 }, (_, hour) => formatGridHourLabel(hour));

export const clickIntervalForCell = (anchorDate: Date, cellIndex: number): ClickInterval => {
  const clamped = Math.max(0, Math.min(GRID_CELL_COUNT - 1, cellIndex));
  const dayStart = startOfLocalDay(anchorDate);
  const start = addMinutes(dayStart, clamped * GRID_CELL_MINUTES);
  const end = addMinutes(dayStart, (clamped + 1) * GRID_CELL_MINUTES);
  return { start, end };
};

export const occupiedFacilityIds = (booking: Pick<BookingListItem, "facilityId" | "facilityIds">): string[] => {
  if (booking.facilityIds && booking.facilityIds.length > 0) {
    return booking.facilityIds;
  }
  if (booking.facilityId) {
    return [booking.facilityId];
  }
  return [];
};

const assignOverlapLanes = (blocks: Omit<GridOccupancyBlock, "lane" | "laneCount">[]): GridOccupancyBlock[] => {
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  const laneEnds: number[] = [];
  const withLanes = sorted.map((block) => {
    let lane = laneEnds.findIndex((end) => end <= block.startMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(block.endMinutes);
    } else {
      laneEnds[lane] = block.endMinutes;
    }
    return { ...block, lane, laneCount: 1 };
  });

  for (let i = 0; i < withLanes.length; i++) {
    let clusterEnd = withLanes[i].endMinutes;
    let maxLane = withLanes[i].lane;
    let j = i + 1;
    while (j < withLanes.length && withLanes[j].startMinutes < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, withLanes[j].endMinutes);
      maxLane = Math.max(maxLane, withLanes[j].lane);
      j++;
    }
    const laneCount = maxLane + 1;
    for (let k = i; k < j; k++) {
      withLanes[k].laneCount = laneCount;
    }
    i = j - 1;
  }

  return withLanes;
};

const layoutBlocksForRoom = (bookings: BookingListItem[], roomId: string, day: Date): GridOccupancyBlock[] => {
  const dayStart = startOfLocalDay(day);
  const dayEnd = addMinutes(dayStart, GRID_DAY_MINUTES);

  const placed = bookings
    .filter((item) => item.status !== "cancelled")
    .filter((item) => occupiedFacilityIds(item).includes(roomId))
    .map((item) => {
      const start = new Date(item.startAt);
      const end = new Date(item.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      if (end <= dayStart || start >= dayEnd) return null;

      const clampedStart = start < dayStart ? dayStart : start;
      const clampedEnd = end > dayEnd ? dayEnd : end;
      if (clampedEnd <= clampedStart) return null;

      const startMinutes = Math.max(0, (clampedStart.getTime() - dayStart.getTime()) / 60000);
      const endMinutes = Math.min(GRID_DAY_MINUTES, (clampedEnd.getTime() - dayStart.getTime()) / 60000);
      if (endMinutes <= startMinutes) return null;

      return {
        booking: item,
        leftPercent: (startMinutes / GRID_DAY_MINUTES) * 100,
        widthPercent: ((endMinutes - startMinutes) / GRID_DAY_MINUTES) * 100,
        startMinutes,
        endMinutes,
      };
    })
    .filter((item): item is Omit<GridOccupancyBlock, "lane" | "laneCount"> => item !== null);

  return assignOverlapLanes(placed);
};

export const layoutGridOccupancyBlocks = (
  bookings: BookingListItem[],
  rooms: Array<{ id: string }>,
  anchorDate: Date
): Map<string, GridOccupancyBlock[]> => {
  const map = new Map<string, GridOccupancyBlock[]>();
  for (const room of rooms) {
    map.set(room.id, layoutBlocksForRoom(bookings, room.id, anchorDate));
  }
  return map;
};

export const defaultViewportScrollRatio = (): number => DEFAULT_VIEWPORT_MINUTE / GRID_DAY_MINUTES;

export const toLocalDatetimeValue = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
