import { useEffect, useState } from "react";
import CalendarToolBar from "./CalendarToolbar";
import DayView from "./DayView";
import MonthView from "./MonthView";
import { CalendarProps, CalendarView } from "./types";
import WeekView from "./WeekView";

const Calendar = ({
  currentDate = new Date(),
  defaultView = "month",
  availableViews = ["day", "week", "month"],
  events = [],
  validRange,
  onDateChange,
  onViewChange,
  onEventClick,
  onEventContextMenu,
  onAddEvent,
  showNavigationButtons = true,
}: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  // Validate and set initial view
  const getInitialView = (): CalendarView => {
    if (availableViews.includes(defaultView)) {
      return defaultView;
    }
    // If defaultView is not in availableViews, use the first available view
    return availableViews[0] || "month";
  };

  const [currentView, setCurrentView] = useState<CalendarView>(getInitialView());

  // Get showNavigationButtons value based on current view
  const getShowNavigationButtons = (): { nav: boolean; today: boolean } => {
    if (typeof showNavigationButtons === "boolean") {
      return { nav: showNavigationButtons, today: showNavigationButtons };
    }

    // If it's an object, get the value for current view
    const viewConfig = showNavigationButtons[currentView];

    if (viewConfig === undefined) {
      return { nav: false, today: false };
    }

    // If it's a boolean, use it for both nav and today
    if (typeof viewConfig === "boolean") {
      return { nav: viewConfig, today: viewConfig };
    }

    // If it's an object with nav and today properties
    return {
      nav: viewConfig.nav ?? false,
      today: viewConfig.today ?? false,
    };
  };

  // Validate currentView when availableViews changes
  useEffect(() => {
    if (!availableViews.includes(currentView)) {
      const fallbackView = availableViews[0] || "month";
      setCurrentView(fallbackView);
      onViewChange?.(fallbackView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableViews]);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    handleDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    handleDateChange(newDate);
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  const renderView = () => {
    const viewProps = {
      currentDate: selectedDate,
      events,
      validRange,
      onDateChange: handleDateChange,
      onEventClick,
      onEventContextMenu,
      onAddEvent,
    };

    switch (currentView) {
      case "day":
        return <DayView {...viewProps} />;
      case "week":
        return <WeekView {...viewProps} />;
      case "month":
        return <MonthView {...viewProps} />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <CalendarToolBar
        currentDate={selectedDate}
        currentView={currentView}
        availableViews={availableViews}
        validRange={validRange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={handleViewChange}
        onAddEvent={onAddEvent ? () => onAddEvent() : undefined}
        showNavigationButtons={getShowNavigationButtons()}
      />
      {renderView()}
    </div>
  );
};

export default Calendar;
