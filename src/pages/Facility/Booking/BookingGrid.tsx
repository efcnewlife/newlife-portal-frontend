import type { BookingListItem } from "@/api/services/facilityService";
import NavigationButtons from "@/components/calendar/NavigationButtons";
import { formatDate, formatWeekday } from "@/components/calendar/utils";
import { cn } from "@/utils";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  GRID_CELL_COUNT,
  clickIntervalForCell,
  defaultViewportScrollRatio,
  formatGridCellStartLabel,
  formatGridHourLabel,
  gridHourLabels,
  layoutGridOccupancyBlocks,
  toLocalDatetimeValue,
} from "./bookingGridLayout";

const CELL_MIN_WIDTH_REM = 2.75;
const ROOM_COLUMN_WIDTH_CLASS = "w-40";
const ROOM_COLUMN_WIDTH_PX = 160;

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

const roomLabel = (room: { code: string; name?: string }): string => room.name || room.code;

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
  const { t } = useTranslation("facility");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hourLabels = useMemo(() => gridHourLabels(), []);
  const cellIndexes = useMemo(() => Array.from({ length: GRID_CELL_COUNT }, (_, index) => index), []);

  useEffect(() => {
    onVisibleRangeChange({ start: startOfDay(anchorDate), end: endOfDay(anchorDate) });
  }, [anchorDate, onVisibleRangeChange]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const applyDefaultScroll = () => {
      const timeWidth = Math.max(0, node.scrollWidth - ROOM_COLUMN_WIDTH_PX);
      if (timeWidth <= 0) return;
      node.scrollLeft = defaultViewportScrollRatio() * timeWidth;
    };
    applyDefaultScroll();
    requestAnimationFrame(applyDefaultScroll);
  }, [anchorDate, rooms.length]);

  const blocksByRoom = useMemo(
    () => layoutGridOccupancyBlocks(bookings, rooms, anchorDate),
    [anchorDate, bookings, rooms]
  );

  const shiftDay = (delta: number) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + delta);
    onAnchorDateChange(next);
  };

  const handleCellClick = (facilityId: string, cellIndex: number) => {
    if (!canCreate) return;
    const { start, end } = clickIntervalForCell(anchorDate, cellIndex);
    onAddCell(facilityId, toLocalDatetimeValue(start), toLocalDatetimeValue(end));
  };

  const timeColumnsStyle = {
    gridTemplateColumns: `repeat(${GRID_CELL_COUNT}, minmax(${CELL_MIN_WIDTH_REM}rem, ${CELL_MIN_WIDTH_REM}rem))`,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-white/10">
      <div className="flex flex-none items-center justify-between border-b border-gray-300 bg-gray-200 px-4 py-3 dark:border-white/10 dark:bg-gray-800/50 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            <time dateTime={`${anchorDate.getFullYear()}-${pad(anchorDate.getMonth() + 1)}-${pad(anchorDate.getDate())}`}>
              {formatDate(anchorDate, "full")}
            </time>
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {formatWeekday(anchorDate, "full")} · {t("booking.view.grid")}
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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-white dark:bg-gray-900">
        {rooms.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">{t("booking.grid.noRooms")}</p>
        ) : (
          <div className="relative inline-block min-w-full">
            <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-800/80">
              <div
                className={cn(
                  "sticky left-0 z-30 flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 dark:border-white/10 dark:bg-gray-800/80 dark:text-gray-400",
                  ROOM_COLUMN_WIDTH_CLASS
                )}
              >
                {t("booking.grid.room")}
              </div>
              <div className="relative grid" style={timeColumnsStyle}>
                {cellIndexes.map((cellIndex) => {
                  const isHourStart = cellIndex % 2 === 0;
                  const hour = cellIndex / 2;
                  return (
                    <div
                      key={cellIndex}
                      className={cn(
                        "border-r border-gray-200 px-0.5 py-2 text-center text-[10px] font-medium text-gray-500 dark:border-white/10 dark:text-gray-400",
                        cellIndex === GRID_CELL_COUNT - 1 && "border-r-0"
                      )}
                    >
                      {isHourStart ? hourLabels[hour] : null}
                    </div>
                  );
                })}
                <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {formatGridHourLabel(24)}
                </span>
              </div>
            </div>

            {rooms.map((room) => {
              const blocks = blocksByRoom.get(room.id) || [];
              return (
                <div key={room.id} className="flex border-b border-gray-100 dark:border-white/5">
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex shrink-0 items-center border-r border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100",
                      ROOM_COLUMN_WIDTH_CLASS
                    )}
                  >
                    <span className="truncate" title={roomLabel(room)}>
                      {roomLabel(room)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="grid h-14" style={timeColumnsStyle}>
                      {cellIndexes.map((cellIndex) => (
                          <button
                            key={cellIndex}
                            type="button"
                            disabled={!canCreate}
                            aria-label={t("booking.grid.addSlot", {
                              room: roomLabel(room),
                              hour: formatGridCellStartLabel(cellIndex),
                            })}
                            className={cn(
                              "border-r border-gray-100 dark:border-white/5",
                              cellIndex % 2 === 1 && "border-r-gray-200/80 dark:border-r-white/10",
                              cellIndex === GRID_CELL_COUNT - 1 && "border-r-0",
                              canCreate && "hover:bg-brand-50/60 dark:hover:bg-brand-500/10",
                              !canCreate && "cursor-default"
                            )}
                            onClick={() => handleCellClick(room.id, cellIndex)}
                          />
                        ))}
                    </div>
                    {blocks.map(({ booking, leftPercent, widthPercent, lane, laneCount }) => {
                      const topPercent = (lane / laneCount) * 100;
                      const heightPercent = 100 / laneCount;
                      return (
                        <button
                          key={`${booking.id}-${room.id}`}
                          type="button"
                          className="absolute z-[1] overflow-hidden rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-left hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/20 dark:hover:bg-brand-500/30"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 0.4)}%`,
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
