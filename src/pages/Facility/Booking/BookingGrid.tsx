import type { BookingListItem } from "@/api/services/facilityService";
import NavigationButtons from "@/components/calendar/NavigationButtons";
import { formatDate, formatWeekday } from "@/components/calendar/utils";
import { cn } from "@/utils";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 22;
const HOUR_COLUMNS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const WINDOW_START_MINUTES = GRID_START_HOUR * 60;
const WINDOW_END_MINUTES = GRID_END_HOUR * 60;
const WINDOW_SPAN_MINUTES = WINDOW_END_MINUTES - WINDOW_START_MINUTES;

interface BookingGridProps {
  anchorDate: Date;
  rooms: Array<{ id: string; code: string; name?: string }>;
  bookings: BookingListItem[];
  canCreate: boolean;
  onAnchorDateChange: (date: Date) => void;
  onVisibleRangeChange: (range: { start: Date; end: Date }) => void;
  onBookingClick: (booking: BookingListItem) => void;
  onAddCell: (facilityId: string, startLocal: string, endLocal: string) => void;
}

const pad = (n: number): string => String(n).padStart(2, "0");

const toLocalDatetimeValue = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const minutesFromMidnight = (date: Date): number => date.getHours() * 60 + date.getMinutes();

const formatHourLabel = (hour: number, locale: string): string => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.startsWith("en"),
  });
};

const roomLabel = (room: { code: string; name?: string }): string =>
  room.name ? `${room.code} - ${room.name}` : room.code;

interface GridBlockLayout {
  booking: BookingListItem;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
  lane: number;
  laneCount: number;
}

const assignOverlapLanes = (blocks: Omit<GridBlockLayout, "lane" | "laneCount">[]): GridBlockLayout[] => {
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

  // Cluster overlapping groups so laneCount reflects local stack depth.
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

const layoutBlocksForRoom = (
  bookings: BookingListItem[],
  roomId: string,
  day: Date
): GridBlockLayout[] => {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const windowStart = new Date(day);
  windowStart.setHours(GRID_START_HOUR, 0, 0, 0);
  const windowEnd = new Date(day);
  windowEnd.setHours(GRID_END_HOUR, 0, 0, 0);

  const placed = bookings
    .filter((booking) => booking.status !== "cancelled")
    .filter((booking) => booking.facilityId === roomId)
    .map((booking) => {
      const start = new Date(booking.startAt);
      const end = new Date(booking.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      if (end <= dayStart || start > dayEnd) return null;

      const clampedStart = start < windowStart ? windowStart : start;
      const clampedEnd = end > windowEnd ? windowEnd : end;
      if (clampedEnd <= clampedStart) return null;

      const startMinutes = Math.max(minutesFromMidnight(clampedStart), WINDOW_START_MINUTES);
      const endMinutes = Math.min(minutesFromMidnight(clampedEnd), WINDOW_END_MINUTES);
      if (endMinutes <= startMinutes) return null;

      return {
        booking,
        leftPercent: ((startMinutes - WINDOW_START_MINUTES) / WINDOW_SPAN_MINUTES) * 100,
        widthPercent: ((endMinutes - startMinutes) / WINDOW_SPAN_MINUTES) * 100,
        startMinutes,
        endMinutes,
      };
    })
    .filter((item): item is Omit<GridBlockLayout, "lane" | "laneCount"> => item !== null);

  return assignOverlapLanes(placed);
};

const BookingGrid = ({
  anchorDate,
  rooms,
  bookings,
  canCreate,
  onAnchorDateChange,
  onVisibleRangeChange,
  onBookingClick,
  onAddCell,
}: BookingGridProps) => {
  const { t, i18n } = useTranslation("facility");
  const locale = i18n.language || "en";

  useEffect(() => {
    onVisibleRangeChange({ start: startOfDay(anchorDate), end: endOfDay(anchorDate) });
  }, [anchorDate, onVisibleRangeChange]);

  const blocksByRoom = useMemo(() => {
    const map = new Map<string, GridBlockLayout[]>();
    for (const room of rooms) {
      map.set(room.id, layoutBlocksForRoom(bookings, room.id, anchorDate));
    }
    return map;
  }, [anchorDate, bookings, rooms]);

  const shiftDay = (delta: number) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + delta);
    onAnchorDateChange(next);
  };

  const handleCellClick = (facilityId: string, hour: number) => {
    if (!canCreate) return;
    const start = new Date(anchorDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(anchorDate);
    end.setHours(hour + 1, 0, 0, 0);
    onAddCell(facilityId, toLocalDatetimeValue(start), toLocalDatetimeValue(end));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-white/10">
      <div className="flex flex-none items-center justify-between border-b border-gray-300 bg-gray-200 px-4 py-3 dark:border-white/10 dark:bg-gray-800/50 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            <time dateTime={`${anchorDate.getFullYear()}-${pad(anchorDate.getMonth() + 1)}-${pad(anchorDate.getDate())}`}>
              {formatDate(anchorDate, "full", locale)}
            </time>
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {formatWeekday(anchorDate, "full", locale)} · {t("booking.view.grid")}
          </p>
        </div>
        <NavigationButtons
          currentDate={anchorDate}
          currentView="day"
          onPrevious={() => shiftDay(-1)}
          onNext={() => shiftDay(1)}
          onToday={() => onAnchorDateChange(new Date())}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-gray-900">
        {rooms.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">{t("booking.grid.noRooms")}</p>
        ) : (
          <div className="min-w-[720px]">
            <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-800/80">
              <div className="sticky left-0 z-30 flex w-40 shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 dark:border-white/10 dark:bg-gray-800/80 dark:text-gray-400">
                {t("booking.grid.room")}
              </div>
              <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${HOUR_COLUMNS.length}, minmax(3.5rem, 1fr))` }}>
                {HOUR_COLUMNS.map((hour) => (
                  <div
                    key={hour}
                    className="border-r border-gray-200 px-1 py-2 text-center text-xs font-medium text-gray-500 last:border-r-0 dark:border-white/10 dark:text-gray-400"
                  >
                    {formatHourLabel(hour, locale)}
                  </div>
                ))}
              </div>
            </div>

            {rooms.map((room) => {
              const blocks = blocksByRoom.get(room.id) || [];
              return (
                <div key={room.id} className="flex border-b border-gray-100 dark:border-white/5">
                  <div className="sticky left-0 z-10 flex w-40 shrink-0 items-center border-r border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100">
                    <span className="truncate" title={roomLabel(room)}>
                      {roomLabel(room)}
                    </span>
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <div className="grid h-14" style={{ gridTemplateColumns: `repeat(${HOUR_COLUMNS.length}, minmax(3.5rem, 1fr))` }}>
                      {HOUR_COLUMNS.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          disabled={!canCreate}
                          aria-label={t("booking.grid.addSlot", {
                            room: roomLabel(room),
                            hour: formatHourLabel(hour, locale),
                          })}
                          className={cn(
                            "border-r border-gray-100 last:border-r-0 dark:border-white/5",
                            canCreate && "hover:bg-brand-50/60 dark:hover:bg-brand-500/10",
                            !canCreate && "cursor-default"
                          )}
                          onClick={() => handleCellClick(room.id, hour)}
                        />
                      ))}
                    </div>
                    {blocks.map(({ booking, leftPercent, widthPercent, lane, laneCount }) => {
                      const topPercent = (lane / laneCount) * 100;
                      const heightPercent = 100 / laneCount;
                      return (
                        <button
                          key={booking.id}
                          type="button"
                          className="absolute z-[1] overflow-hidden rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-left hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/20 dark:hover:bg-brand-500/30"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 2)}%`,
                            top: `calc(${topPercent}% + 2px)`,
                            height: `calc(${heightPercent}% - 4px)`,
                          }}
                          title={booking.userDisplayName || booking.userEmail || booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick(booking);
                          }}
                        >
                          <span className="block truncate text-xs font-medium text-brand-600 dark:text-brand-300">
                            {booking.userDisplayName || booking.userEmail || booking.facilityName || booking.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingGrid;
