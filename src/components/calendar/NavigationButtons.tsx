import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";
import CalendarDateControl from "./CalendarDateControl";
import { CalendarView, DateRange } from "./types";
import { canNavigateNext, canNavigatePrevious } from "./utils";

interface NavigationButtonsProps {
  currentDate: Date;
  currentView: CalendarView;
  validRange?: DateRange;
  onPrevious: () => void;
  onNext: () => void;
  onDateChange: (date: Date) => void;
  showNav?: boolean;
  /** When true, show the Calendar date control (date picker + Today). */
  showDateControl?: boolean;
}

const NavigationButtons = ({
  currentDate,
  currentView,
  validRange,
  onPrevious,
  onNext,
  onDateChange,
  showNav = true,
  showDateControl = true,
}: NavigationButtonsProps) => {
  const { t } = useTranslation("calendar");
  const showPreviousNext = showNav;

  const getPreviousLabel = (view: CalendarView): string => {
    switch (view) {
      case "day":
        return t("nav.previousDay");
      case "week":
        return t("nav.previousWeek");
      case "month":
        return t("nav.previousMonth");
    }
  };

  const getNextLabel = (view: CalendarView): string => {
    switch (view) {
      case "day":
        return t("nav.nextDay");
      case "week":
        return t("nav.nextWeek");
      case "month":
        return t("nav.nextMonth");
    }
  };

  if (!showPreviousNext && !showDateControl) {
    return null;
  }

  const navButtonClasses =
    "flex h-9 w-9 items-center justify-center text-gray-400 hover:text-gray-500 focus:relative hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent";

  return (
    <div className="flex items-center gap-2">
      {showPreviousNext && (
        <div className="relative flex items-stretch rounded-md bg-white shadow-xs outline -outline-offset-1 outline-gray-300 dark:bg-white/10 dark:shadow-none dark:outline-white/5">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canNavigatePrevious(currentDate, currentView, validRange)}
            className={cn(navButtonClasses, "rounded-l-md")}
          >
            <span className="sr-only">{getPreviousLabel(currentView)}</span>
            <MdChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNavigateNext(currentDate, currentView, validRange)}
            className={cn(navButtonClasses, "rounded-r-md")}
          >
            <span className="sr-only">{getNextLabel(currentView)}</span>
            <MdChevronRight className="size-5" />
          </button>
        </div>
      )}
      {showDateControl && (
        <CalendarDateControl value={currentDate} onChange={onDateChange} validRange={validRange} />
      )}
    </div>
  );
};

export default NavigationButtons;
