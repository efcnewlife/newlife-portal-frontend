import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import EventBlock from "./EventBlock";
import { CalendarViewProps } from "./types";
import { getMonthDays, isDateInRange } from "./utils";

const DayView = ({ currentDate, events = [], validRange, onEventClick, onDateChange, onEventContextMenu, onAddEvent }: CalendarViewProps) => {
  // Filter events that overlap with the current day (including multi-day events)
  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
      const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
      // Event overlaps with the day if it starts before the day ends and ends after the day starts
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const dayEvents = getEventsForDay(currentDate);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(currentDate);

  // Sync mini calendar month when currentDate changes
  useEffect(() => {
    setMiniCalendarMonth(currentDate);
  }, [currentDate]);

  const handleDayClick = (date: string) => {
    // Parse date string (YYYY-MM-DD) as local time, not UTC
    const [year, month, day] = date.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    // Check if date is within valid range
    if (isDateInRange(newDate, validRange)) {
      onDateChange(newDate);
    }
  };

  const handleMiniCalendarPrevious = () => {
    const newDate = new Date(miniCalendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setMiniCalendarMonth(newDate);
  };

  const handleMiniCalendarNext = () => {
    const newDate = new Date(miniCalendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setMiniCalendarMonth(newDate);
  };

  const miniCalendarDays = getMonthDays(miniCalendarMonth);

  // Generate 24 hours for time axis
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate 48 time slots (24 hours * 2 slots per hour = 30-minute intervals)
  // Each slot is 48px tall (h-24 = 96px / 2 = 48px for 30 minutes)
  // Total height: 48 * 48px = 2304px
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const isHalfHour = i % 2 === 1;
    return { hour, isHalfHour, index: i };
  });

  // Calculate event position in pixels, handling events that continue from previous day
  // Each 30-minute slot is 48px tall, so each minute is 48/30 = 1.6px
  // Uses local time (getHours, getMinutes return local time)
  const getEventTop = (date: string | Date, dayDate: Date): number => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);

    // If event starts before this day, start from 0
    if (dateObj < dayStart) {
      return 0;
    }

    // getHours() and getMinutes() return local time
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    // Total minutes from midnight (local time)
    const totalMinutes = hours * 60 + minutes;
    // Convert to pixels (each minute is 1.6px: 48px / 30 minutes)
    return (totalMinutes / 30) * 48;
  };

  // Calculate event height in pixels, clamping to end of day if event spans to next day
  // Uses local time for calculations
  const getEventHeight = (start: string | Date, end: string | Date, dayDate: Date): number => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);

    // Get day boundaries in local timezone
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
    const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

    // Clamp event start and end to day boundaries
    const clampedStart = startDate < dayStart ? dayStart : startDate;
    const clampedEnd = endDate > dayEnd ? dayEnd : endDate;

    // Calculate difference in minutes
    const diffMinutes = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60);

    // Convert minutes to pixels (each minute is 1.6px: 48px / 30 minutes)
    // Minimum height of 48px (30 minutes)
    return Math.max((diffMinutes / 30) * 48, 48);
  };

  // Check if event spans to next day
  const isEventSpanningToNextDay = (_start: string | Date, end: string | Date, dayDate: Date): boolean => {
    const endDate = end instanceof Date ? end : new Date(end);
    const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);
    return endDate > dayEnd;
  };

  // Check if event continues from previous day
  const isEventContinuingFromPreviousDay = (start: string | Date, dayDate: Date): boolean => {
    const startDate = start instanceof Date ? start : new Date(start);
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
    return startDate < dayStart;
  };

  // Check if event is fully within this day
  const isEventFullyWithinDay = (start: string | Date, end: string | Date, dayDate: Date): boolean => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
    const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);
    return startDate >= dayStart && endDate <= dayEnd;
  };

  return (
    <div className="flex flex-auto overflow-hidden border border-gray-300 dark:border-white/10 rounded-b-2xl">
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="relative flex flex-1 overflow-y-auto">
          {/* Left time axis */}
          <div className="flex h-max w-18 flex-col border-r border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50">
            {hours.map((hour) => (
              <div key={hour} className="group relative flex h-24 items-start justify-end bg-gray-50 dark:bg-gray-800/50 pr-2">
                <span className="text-right text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400 group-first:translate-y-1">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 bg-white dark:bg-gray-900" style={{ minHeight: "2304px" }}>
            <div className="relative h-full w-full">
              {/* Hoverable time slots */}
              {timeSlots.map((slot) => {
                const isLastSlot = slot.index === 47;
                const top = slot.index * 48; // Each slot is 48px
                
                // Calculate start time for this slot (HH:mm format)
                const startHour = slot.hour;
                const startMinute = slot.isHalfHour ? 30 : 0;
                const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
                
                // Calculate end time for this slot (30 minutes later, HH:mm format)
                const endHour = slot.isHalfHour ? (slot.hour + 1) % 24 : slot.hour;
                const endMinute = slot.isHalfHour ? 0 : 30;
                const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
                
                return (
                  <div
                    key={slot.index}
                    className={`group relative flex h-12 flex-col bg-white dark:bg-gray-900 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 before:pointer-events-none before:absolute before:inset-0 before:border-b before:border-gray-200 dark:before:border-white/5 ${
                      isLastSlot ? "last:before:border-b-0" : ""
                    } transition-colors`}
                    style={{
                      position: "absolute",
                      top: `${top}px`,
                      left: 0,
                      width: "100%",
                      height: "48px",
                    }}
                  >
                    {onAddEvent && (
                      <div className="absolute right-1.5 bottom-1.5 hidden group-hover:inline-flex z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEvent(currentDate, startTime, endTime);
                          }}
                          className="flex items-center justify-center size-7 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                          aria-label="Add event"
                        >
                          <MdAdd className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Events */}
              {dayEvents.map((event) => {
                const eventTop = getEventTop(event.start, currentDate);
                const eventHeight = getEventHeight(event.start, event.end, currentDate);
                const isSpanning = isEventSpanningToNextDay(event.start, event.end, currentDate);
                const isContinuing = isEventContinuingFromPreviousDay(event.start, currentDate);
                const isFullDay = isEventFullyWithinDay(event.start, event.end, currentDate);

                return (
                  <EventBlock
                    key={event.id}
                    event={event}
                    top={eventTop}
                    height={eventHeight}
                    isSpanning={isSpanning}
                    isContinuing={isContinuing}
                    isFullDay={isFullDay}
                    dayDate={currentDate}
                    onEventClick={onEventClick}
                    onContextMenu={onEventContextMenu}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 dark:border-white/10">
        <div className="flex items-center text-center text-gray-900 dark:text-white">
          <button
            type="button"
            onClick={handleMiniCalendarPrevious}
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
          >
            <span className="sr-only">Previous month</span>
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="flex-auto text-sm font-semibold">
            {miniCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={handleMiniCalendarNext}
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
          >
            <span className="sr-only">Next month</span>
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="mt-6 grid grid-cols-7 text-center text-xs/6 text-gray-500 dark:text-gray-400">
          <div>S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
        </div>
        <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:shadow-none dark:ring-white/10">
          {miniCalendarDays.map((day) => {
            // Parse date string (YYYY-MM-DD) as local time
            const [year, month, dayNum] = day.date.split("-").map(Number);
            const dayDate = new Date(year, month - 1, dayNum);
            
            // Normalize currentDate to local timezone for comparison
            const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const normalizedDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
            const isSelected = normalizedDayDate.getTime() === normalizedCurrentDate.getTime();
            const isToday = day.isToday;

            const isInRange = isDateInRange(dayDate, validRange);
            const isDisabled = !isInRange;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => handleDayClick(day.date)}
                disabled={isDisabled}
                data-is-today={isToday ? "" : undefined}
                data-is-selected={isSelected ? "" : undefined}
                data-is-current-month={day.isCurrentMonth ? "" : undefined}
                data-is-disabled={isDisabled ? "" : undefined}
                className={`py-1.5 not-data-is-current-month:bg-gray-50 not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-400 first:rounded-tl-lg last:rounded-br-lg hover:bg-gray-100 focus:z-10 data-is-current-month:bg-white not-data-is-selected:data-is-current-month:not-data-is-today:text-gray-900 data-is-current-month:hover:bg-gray-100 data-is-selected:font-semibold data-is-selected:text-white data-is-today:font-semibold data-is-today:not-data-is-selected:text-indigo-600 nth-36:rounded-bl-lg nth-7:rounded-tr-lg dark:not-data-is-current-month:bg-gray-900/75 dark:not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-500 dark:hover:bg-gray-900/25 dark:data-is-current-month:bg-gray-900/90 dark:not-data-is-selected:data-is-current-month:not-data-is-today:text-white dark:data-is-current-month:hover:bg-gray-900/50 dark:data-is-selected:text-gray-900 dark:data-is-today:not-data-is-selected:text-indigo-400 ${
                  isDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <time
                  dateTime={day.date}
                  className="mx-auto flex size-7 items-center justify-center rounded-full in-data-is-selected:not-in-data-is-today:bg-gray-900 in-data-is-selected:in-data-is-today:bg-indigo-600 dark:in-data-is-selected:not-in-data-is-today:bg-white dark:in-data-is-selected:in-data-is-today:bg-indigo-500"
                >
                  {day.date.split("-").pop()?.replace(/^0/, "") || ""}
                </time>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
