import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";
import DayView from "./DayView";
import { formatEventTimeClock } from "./formatEventTime";
import { DEFAULT_MONTH_SUMMARY_LINE_HEIGHT_PX, monthCellSummaryCapacity } from "./monthLayout";
import { CalendarEvent, CalendarViewProps } from "./types";
import { filterEventsByDateRange, formatWeekday, getMonthDays, isDateInRange } from "./utils";

const DAY_NUMBER_RESERVE_PX = 28;
const CELL_VERTICAL_PADDING_PX = 16;

const eventsForDay = (events: CalendarEvent[], dayDate: Date): CalendarEvent[] => {
  return filterEventsByDateRange(events, dayDate, dayDate).sort((a, b) => {
    const aStart = a.start instanceof Date ? a.start : new Date(a.start);
    const bStart = b.start instanceof Date ? b.start : new Date(b.start);
    return aStart.getTime() - bStart.getTime();
  });
};

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const visibleSummariesForCell = (
  dayEvents: CalendarEvent[],
  contentHeightPx: number
): { visibleEvents: CalendarEvent[]; hiddenCount: number } => {
  const hasEvents = dayEvents.length > 0;
  if (!hasEvents) {
    return { visibleEvents: [], hiddenCount: 0 };
  }

  const totalLines = monthCellSummaryCapacity(contentHeightPx, {
    lineHeightPx: DEFAULT_MONTH_SUMMARY_LINE_HEIGHT_PX,
    hasEvents: true,
  });

  if (dayEvents.length <= totalLines) {
    return { visibleEvents: dayEvents.slice(0, totalLines), hiddenCount: 0 };
  }

  // Reserve one line for "+ N more" when more than one line fits; if only one line
  // fits, that line is the more control (no summary overflow).
  if (totalLines === 1) {
    return { visibleEvents: [], hiddenCount: dayEvents.length };
  }

  const visibleEvents = dayEvents.slice(0, totalLines - 1);
  return {
    visibleEvents,
    hiddenCount: dayEvents.length - visibleEvents.length,
  };
};

const MonthView = ({
  currentDate,
  events = [],
  validRange,
  onEventClick,
  onEventContextMenu,
  onDateChange,
  onAddEvent,
  onDensityOverflow,
}: CalendarViewProps) => {
  const { t, i18n } = useTranslation("calendar");
  const locale = i18n.language || "en";
  const days = getMonthDays(currentDate);
  const measureCellRef = useRef<HTMLDivElement>(null);
  const [contentHeightPx, setContentHeightPx] = useState(0);

  useEffect(() => {
    const el = measureCellRef.current;
    if (!el) return;

    const measure = () => {
      setContentHeightPx(Math.max(0, el.clientHeight - DAY_NUMBER_RESERVE_PX - CELL_VERTICAL_PADDING_PX));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentDate]);

  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 7 + index);
    return formatWeekday(date, "short", locale);
  });

  const handleDaySelect = (dateStr: string) => {
    const next = parseLocalDate(dateStr);
    if (isDateInRange(next, validRange)) {
      onDateChange(next);
    }
  };

  const normalizedCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-b-2xl border-x border-b border-gray-300 dark:border-white/10">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="grid flex-none grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 dark:border-white/5 dark:bg-white/15 dark:text-gray-300">
          {weekdayLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="flex justify-center bg-white py-2 dark:bg-gray-900">
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex min-h-0 flex-auto overflow-hidden bg-gray-200 text-xs/6 text-gray-700 dark:bg-white/10 dark:text-gray-300">
          <div className="grid w-full grid-cols-7 grid-rows-6 gap-px">
            {days.map((day, index) => {
              const dayDate = parseLocalDate(day.date);
              const dayEvents = eventsForDay(events, dayDate);
              const isSelected = dayDate.getTime() === normalizedCurrent.getTime();
              const isToday = !!day.isToday;
              const isDisabled = !isDateInRange(dayDate, validRange);
              const { visibleEvents, hiddenCount } = visibleSummariesForCell(dayEvents, contentHeightPx);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day.date}
                  ref={index === 0 ? measureCellRef : undefined}
                  data-is-today={isToday ? "" : undefined}
                  data-is-selected={isSelected ? "" : undefined}
                  data-is-current-month={day.isCurrentMonth ? "" : undefined}
                  data-is-disabled={isDisabled ? "" : undefined}
                  className={cn(
                    "group relative cursor-pointer bg-gray-50 px-2 py-2 text-gray-500 transition-colors data-is-current-month:bg-white data-is-current-month:hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:data-is-current-month:bg-gray-900 dark:data-is-current-month:hover:bg-gray-800/50",
                    isDisabled && "cursor-not-allowed opacity-50",
                    !day.isCurrentMonth && "opacity-75"
                  )}
                  onClick={() => {
                    if (!isDisabled) {
                      handleDaySelect(day.date);
                    }
                  }}
                >
                  <time
                    dateTime={day.date}
                    className={cn(
                      "relative inline-flex size-6 items-center justify-center",
                      isToday && "rounded-full bg-brand-500 font-semibold text-white dark:bg-brand-500",
                      !isToday &&
                        isSelected &&
                        "rounded-full bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900"
                    )}
                  >
                    {day.date.split("-").pop()?.replace(/^0/, "") || ""}
                  </time>
                  {hasEvents ? (
                    <ol className="mt-1 space-y-0.5">
                      {visibleEvents.map((event) => {
                        const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
                        const timeString = formatEventTimeClock(eventStart, locale);
                        return (
                          <li key={event.id}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDaySelect(day.date);
                                onEventClick?.(event);
                              }}
                              onContextMenu={(e) => {
                                e.stopPropagation();
                                onEventContextMenu?.(event, e);
                              }}
                              className="group/summary flex w-full min-w-0 items-center gap-1 text-left"
                            >
                              <span
                                aria-hidden
                                className="size-1.5 flex-none rounded-full bg-brand-500 dark:bg-brand-400"
                              />
                              <time
                                dateTime={eventStart.toISOString()}
                                className="flex-none text-[11px] text-gray-500 group-hover/summary:text-brand-600 dark:text-gray-400 dark:group-hover/summary:text-brand-400"
                              >
                                {timeString}
                              </time>
                              <span className="min-w-0 flex-auto truncate text-[11px] font-medium text-gray-900 group-hover/summary:text-brand-600 dark:text-white dark:group-hover/summary:text-brand-400">
                                {event.title}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {hiddenCount > 0 ? (
                        <li>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDaySelect(day.date);
                            }}
                            className="text-[11px] text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                          >
                            {t("month.moreSummaries", { count: hiddenCount })}
                          </button>
                        </li>
                      ) : null}
                    </ol>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 w-[42%] min-w-[18rem] max-w-xl flex-none flex-col overflow-hidden border-l border-gray-300 dark:border-white/10">
        <DayView
          currentDate={currentDate}
          events={events}
          validRange={validRange}
          onDateChange={onDateChange}
          onEventClick={onEventClick}
          onEventContextMenu={onEventContextMenu}
          onAddEvent={onAddEvent}
          onDensityOverflow={onDensityOverflow}
          showMiniMonth={false}
          embedded
        />
      </div>
    </div>
  );
};

export default MonthView;
