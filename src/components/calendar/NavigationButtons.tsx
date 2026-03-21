import Button from "@/components/ui/button";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { CalendarView, DateRange } from "./types";
import { canNavigateNext, canNavigatePrevious } from "./utils";

interface NavigationButtonsProps {
  currentDate: Date;
  currentView: CalendarView;
  validRange?: DateRange;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  showNav?: boolean;
  showToday?: boolean;
}

const getNavigationLabel = (currentView: CalendarView): string => {
  switch (currentView) {
    case "day":
      return "Previous day";
    case "week":
      return "Previous week";
    case "month":
      return "Previous month";
  }
};

const getNextLabel = (currentView: CalendarView): string => {
  switch (currentView) {
    case "day":
      return "Next day";
    case "week":
      return "Next week";
    case "month":
      return "Next month";
  }
};

const NavigationButtons = ({
  currentDate,
  currentView,
  validRange,
  onPrevious,
  onNext,
  onToday,
  showNav = true,
  showToday = true,
}: NavigationButtonsProps) => {
  const showPreviousNext = showNav;
  const showTodayButton = showToday;

  // If neither nav nor today should be shown, return null
  if (!showPreviousNext && !showTodayButton) {
    return null;
  }

  // Determine rounded corners based on which buttons are shown
  const getPreviousClasses = () => {
    const baseClasses =
      "flex h-9 w-9 items-center justify-center text-gray-400 hover:text-gray-500 focus:relative hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent";
    if (!showTodayButton) {
      // Only nav buttons: Previous has left rounded, Next has right rounded
      return `${baseClasses} rounded-l-md`;
    }
    // Both nav and today: Previous has left rounded only
    return `${baseClasses} rounded-l-md`;
  };

  const getTodayClasses = () => {
    const baseClasses = "h-9 px-3.5 py-2 text-sm font-semibold border-0 shadow-none bg-transparent hover:bg-gray-50 dark:hover:bg-white/10";
    if (!showPreviousNext) {
      // Only today button: has both rounded corners
      return `${baseClasses} rounded-md`;
    }
    // Both nav and today: no rounded corners
    return `${baseClasses} rounded-none`;
  };

  const getNextClasses = () => {
    const baseClasses =
      "flex h-9 w-9 items-center justify-center text-gray-400 hover:text-gray-500 focus:relative hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent";
    if (!showTodayButton) {
      // Only nav buttons: Next has right rounded
      return `${baseClasses} rounded-r-md`;
    }
    // Both nav and today: Next has right rounded only
    return `${baseClasses} rounded-r-md`;
  };

  return (
    <div className="relative flex items-stretch rounded-md bg-white shadow-xs outline -outline-offset-1 outline-gray-300 dark:bg-white/10 dark:shadow-none dark:outline-white/5">
      {showPreviousNext && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canNavigatePrevious(currentDate, currentView, validRange)}
          className={getPreviousClasses()}
        >
          <span className="sr-only">{getNavigationLabel(currentView)}</span>
          <MdChevronLeft className="size-5" />
        </button>
      )}
      {showTodayButton && (
        <Button onClick={onToday} variant="outline" size="sm" className={getTodayClasses()}>
          Today
        </Button>
      )}
      {showPreviousNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNavigateNext(currentDate, currentView, validRange)}
          className={getNextClasses()}
        >
          <span className="sr-only">{getNextLabel(currentView)}</span>
          <MdChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;
