import { CalendarViewProps } from "./types";
import { filterEventsByDate, getMonthDays, isDateInRange } from "./utils";

const MonthView = ({ currentDate, events = [], validRange, onEventClick, onDateChange }: CalendarViewProps) => {
  const days = getMonthDays(currentDate);

  // Weekday labels - always start with Sunday
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (date: string) => {
    return filterEventsByDate(events, new Date(date));
  };

  const handleDayClick = (date: string) => {
    // Parse date string (YYYY-MM-DD) as local time, not UTC
    const [year, month, day] = date.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    // Check if date is within valid range
    if (isDateInRange(newDate, validRange)) {
      onDateChange(newDate);
    }
  };

  return (
    <div className="flex flex-auto flex-col rounded-b-2xl border-x border-b border-gray-300 dark:border-white/10">
      <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 flex-none dark:border-white/5 dark:bg-white/15 dark:text-gray-300">
        {weekdayLabels.map((label) => (
          <div key={label} className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="flex bg-gray-200 text-xs/6 text-gray-700 flex-auto dark:bg-white/10 dark:text-gray-300 overflow-hidden rounded-b-2xl">
        <div className="w-full grid grid-cols-7 grid-rows-6 gap-px">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day.date);
            // Check if this day is selected (parse as local time)
            const [year, month, dayNum] = day.date.split("-").map(Number);
            const date = new Date(year, month - 1, dayNum);
            date.setHours(0, 0, 0, 0);
            const normalizedCurrentDate = new Date(currentDate);
            normalizedCurrentDate.setHours(0, 0, 0, 0);
            const isSelected = date.getTime() === normalizedCurrentDate.getTime();
            const isToday = day.isToday;

            const dayDate = new Date(year, month - 1, dayNum);
            const isInRange = isDateInRange(dayDate, validRange);
            const isDisabled = !isInRange;

            return (
              <div
                key={day.date}
                data-is-today={isToday ? "" : undefined}
                data-is-selected={isSelected ? "" : undefined}
                data-is-current-month={day.isCurrentMonth ? "" : undefined}
                data-is-disabled={isDisabled ? "" : undefined}
                className={`group relative bg-gray-50 px-3 py-2 text-gray-500 data-is-current-month:bg-white dark:bg-gray-900 dark:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:data-is-current-month:bg-gray-900 data-is-current-month:hover:bg-gray-100 dark:data-is-current-month:hover:bg-gray-800/50 data-is-current-month:cursor-pointer transition-colors ${
                  isDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (day.isCurrentMonth && !isDisabled) {
                    handleDayClick(day.date);
                  }
                }}
              >
                <time
                  dateTime={day.date}
                  className={`relative group-not-data-is-current-month:opacity-75 ${
                    isToday
                      ? "flex size-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white dark:bg-indigo-500"
                      : isSelected
                      ? "flex size-6 items-center justify-center rounded-full bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900"
                      : ""
                  }`}
                >
                  {day.date.split("-").pop()?.replace(/^0/, "") || ""}
                </time>
                {dayEvents.length > 0 ? (
                  <ol className="mt-2">
                    {dayEvents.slice(0, 2).map((event) => {
                      const eventStart = new Date(event.start);
                      const timeString = eventStart.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className="group flex w-full text-left"
                          >
                            <p className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                              {event.title}
                            </p>
                            <time
                              dateTime={eventStart.toISOString()}
                              className="ml-3 flex-none text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400"
                            >
                              {timeString}
                            </time>
                          </button>
                        </li>
                      );
                    })}
                    {dayEvents.length > 2 ? <li className="text-gray-500 dark:text-gray-400">+ {dayEvents.length - 2} more</li> : null}
                  </ol>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthView;
