import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button";
import ButtonGroup from "@/components/ui/buttons-group";
import NavigationButtons from "./NavigationButtons";
import { CalendarView, DateRange } from "./types";
import { formatDate, formatWeekday, getEndOfWeek, getStartOfWeek } from "./utils";

interface CalendarToolBarProps {
  currentDate: Date;
  currentView: CalendarView;
  availableViews?: CalendarView[];
  validRange?: DateRange;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onAddEvent?: () => void;
  showNavigationButtons?: { nav: boolean; today: boolean };
}

const CalendarToolBar = ({
  currentDate,
  currentView,
  availableViews = ["day", "week", "month"],
  validRange,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onAddEvent,
  showNavigationButtons = { nav: true, today: true },
}: CalendarToolBarProps) => {
  // Calculate week number of the month (1-based)
  // Week starts on Sunday (0)
  const getWeekNumber = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const firstDayOfMonthWeekday = firstDayOfMonth.getDay();

    // Calculate which week of the month this date falls into
    // Week 1: days 1 to (7 - firstDayOfMonthWeekday)
    const weekNumber = Math.ceil((day + firstDayOfMonthWeekday) / 7);

    return weekNumber;
  };

  // Create view buttons for ButtonGroup
  const getViewButtons = () => {
    const buttons = [];

    if (availableViews.includes("day")) {
      buttons.push({
        text: "Day",
        onClick: () => onViewChange("day"),
        active: currentView === "day",
        className: "h-9 py-0 px-3 text-sm",
      });
    }

    if (availableViews.includes("week")) {
      buttons.push({
        text: "Week",
        onClick: () => onViewChange("week"),
        active: currentView === "week",
        className: "h-9 py-0 px-3 text-sm",
      });
    }

    if (availableViews.includes("month")) {
      buttons.push({
        text: "Month",
        onClick: () => onViewChange("month"),
        active: currentView === "month",
        className: "h-9 py-0 px-3 text-sm",
      });
    }

    return buttons;
  };

  const getTitle = (): string => {
    switch (currentView) {
      case "day":
        return formatDate(currentDate, "full");
      case "week":
        return formatDate(currentDate, "month-year");
      case "month":
        return formatDate(currentDate, "month-year");
    }
  };

  const formatDateForSubtitle = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getSubtitle = (): string | null => {
    switch (currentView) {
      case "day":
        return formatWeekday(currentDate, "full");
      case "week": {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = getEndOfWeek(currentDate);
        const startFormatted = formatDateForSubtitle(startOfWeek);
        const endFormatted = formatDateForSubtitle(endOfWeek);
        return `${startFormatted} – ${endFormatted}`;
      }
      case "month": {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startFormatted = formatDateForSubtitle(firstDay);
        const endFormatted = formatDateForSubtitle(lastDay);
        return `${startFormatted} – ${endFormatted}`;
      }
      default:
        return null;
    }
  };

  // Get the date to display in the calendar icon
  const getCalendarIconDate = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize currentDate to midnight for accurate comparison
    const normalizedCurrentDate = new Date(currentDate);
    normalizedCurrentDate.setHours(0, 0, 0, 0);

    switch (currentView) {
      case "day":
        // Day view: always show the selected date
        return normalizedCurrentDate;
      case "week": {
        const startOfWeek = getStartOfWeek(normalizedCurrentDate);
        const endOfWeek = getEndOfWeek(normalizedCurrentDate);

        // Check if currentDate (selected date) is within the current week view
        // If the selected date is in the current week, show the selected date
        if (normalizedCurrentDate >= startOfWeek && normalizedCurrentDate <= endOfWeek) {
          return normalizedCurrentDate;
        }

        // Otherwise, check if current week is the same as today's week
        const startOfTodayWeek = getStartOfWeek(today);
        if (startOfWeek.getTime() === startOfTodayWeek.getTime()) {
          return today;
        }
        // Otherwise show the first day of the week
        return startOfWeek;
      }
      case "month": {
        const year = normalizedCurrentDate.getFullYear();
        const month = normalizedCurrentDate.getMonth();

        // Check if currentDate (selected date) is within the current month view
        const selectedYear = normalizedCurrentDate.getFullYear();
        const selectedMonth = normalizedCurrentDate.getMonth();
        if (selectedYear === year && selectedMonth === month) {
          // If the selected date is in the current month, show the selected date
          return normalizedCurrentDate;
        }

        // Otherwise, check if current month is today's month
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        if (year === todayYear && month === todayMonth) {
          return today;
        }
        // Otherwise show the first day of the month
        const firstDay = new Date(year, month, 1);
        firstDay.setHours(0, 0, 0, 0);
        return firstDay;
      }
      default:
        return normalizedCurrentDate;
    }
  };

  const calendarIconDate = getCalendarIconDate();
  const monthAbbr = calendarIconDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = calendarIconDate.getDate();

  return (
    <div className="flex flex-none items-center justify-between px-6 py-4 rounded-t-2xl border border-gray-300 dark:border-white/10 bg-gray-200 dark:bg-gray-800/50">
      <div className="flex items-start gap-3">
        {/* Calendar Icon */}
        <div className="flex flex-col rounded-lg bg-white shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-white/10 overflow-hidden w-12">
          <div className="flex items-center justify-center bg-gray-50 px-2 py-1 border-b border-gray-200 dark:border-white/10 text-[9px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {monthAbbr}
          </div>
          <div className="flex items-center justify-center px-4 py-0.5 text-xl font-bold text-brand-500 dark:text-brand-400">{day}</div>
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <time dateTime={currentDate.toISOString().split("T")[0]}>{getTitle()}</time>
            <Badge variant="solid" color="primary" size="sm">
              Week {getWeekNumber(currentDate)}
            </Badge>
          </h1>
          {getSubtitle() && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{getSubtitle()}</p>}
        </div>
      </div>
      <div className="flex items-center">
        {(showNavigationButtons.nav || showNavigationButtons.today) && (
          <NavigationButtons
            currentDate={currentDate}
            currentView={currentView}
            validRange={validRange}
            onPrevious={onPrevious}
            onNext={onNext}
            onToday={onToday}
            showNav={showNavigationButtons.nav}
            showToday={showNavigationButtons.today}
          />
        )}
        <div className={`flex items-center ${showNavigationButtons.nav || showNavigationButtons.today ? "ml-4" : ""}`}>
          {availableViews.length > 1 && (
            <div className="mr-4">
              <ButtonGroup variant="primary" buttons={getViewButtons()} className="!pb-0 [&>div>div]:!shadow-none" minWidth="auto" />
            </div>
          )}
          {onAddEvent && <div className="mr-6 h-6 w-px bg-gray-300 dark:bg-white/10" />}
          {onAddEvent && (
            <Button
              onClick={onAddEvent}
              variant="primary"
              size="sm"
              className="h-9 bg-brand-500 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus-visible:outline-brand-700"
            >
              Add event
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarToolBar;
