import type { BookingListItem } from "@/api/services/facilityService";
import { Calendar, type CalendarEvent, type CalendarView } from "@/components/calendar";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface BookingCalendarProps {
  anchorDate: Date;
  bookings: BookingListItem[];
  onAnchorDateChange: (date: Date) => void;
  onVisibleRangeChange: (range: { start: Date; end: Date }) => void;
  onEventClick: (booking: BookingListItem) => void;
  onCancelClick: (booking: BookingListItem) => void;
  onAddSlot: (startLocal: string, endLocal: string) => void;
  onDensityOverflow: (date: Date) => void;
}

const toLocalDatetimeValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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

const startOfWeek = (date: Date): Date => {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
};

const endOfWeek = (date: Date): Date => {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
};

const BookingCalendar = ({
  anchorDate,
  bookings,
  onAnchorDateChange,
  onVisibleRangeChange,
  onEventClick,
  onCancelClick,
  onAddSlot,
  onDensityOverflow,
}: BookingCalendarProps) => {
  const { t } = useTranslation("facility");
  const [calendarLayout, setCalendarLayout] = useState<CalendarView>("week");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    booking: BookingListItem;
  } | null>(null);

  useEffect(() => {
    const range =
      calendarLayout === "day"
        ? { start: startOfDay(anchorDate), end: endOfDay(anchorDate) }
        : { start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) };
    onVisibleRangeChange(range);
  }, [anchorDate, calendarLayout, onVisibleRangeChange]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const events: CalendarEvent[] = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => {
          const roomNames =
            booking.facilityNames && booking.facilityNames.length > 0
              ? booking.facilityNames
              : booking.facilityName
                ? [booking.facilityName]
                : [];
          return {
            id: booking.id,
            title: booking.userDisplayName || booking.userEmail || "",
            start: booking.startAt,
            end: booking.endAt,
            tags: roomNames,
            item: booking,
          };
        }),
    [bookings]
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <Calendar
        currentDate={anchorDate}
        defaultView="week"
        availableViews={["week", "day"]}
        events={events}
        onDateChange={onAnchorDateChange}
        onViewChange={setCalendarLayout}
        onEventClick={(event) => {
          const booking = event.item as BookingListItem | undefined;
          if (booking) onEventClick(booking);
        }}
        onEventContextMenu={(event, mouseEvent) => {
          mouseEvent.preventDefault();
          const booking = event.item as BookingListItem | undefined;
          if (!booking) return;
          setContextMenu({ x: mouseEvent.clientX, y: mouseEvent.clientY, booking });
        }}
        onAddEvent={(date, startTime, endTime) => {
          const base = date ? new Date(date) : new Date(anchorDate);
          const [startHour, startMinute] = (startTime || "09:00").split(":").map(Number);
          const [endHour, endMinute] = (endTime || "10:00").split(":").map(Number);
          const start = new Date(base);
          start.setHours(startHour || 9, startMinute || 0, 0, 0);
          const end = new Date(base);
          end.setHours(endHour || 10, endMinute || 0, 0, 0);
          onAddSlot(toLocalDatetimeValue(start), toLocalDatetimeValue(end));
        }}
        onDensityOverflow={onDensityOverflow}
      />

      {contextMenu && (
        <div
          className="fixed z-50 min-w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => {
              onEventClick(contextMenu.booking);
              setContextMenu(null);
            }}
          >
            {t("booking.actions.view")}
          </button>
          {contextMenu.booking.status !== "cancelled" && (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                onCancelClick(contextMenu.booking);
                setContextMenu(null);
              }}
            >
              {t("booking.actions.cancel")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
