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
  onDensityOverflow,
  showNavigationButtons = true,
}: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

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
  const getShowNavigationButtons = (): { nav: boolean; dateControl: boolean } => {
    if (typeof showNavigationButtons === "boolean") {
      return { nav: showNavigationButtons, dateControl: showNavigationButtons };
    }

    // If it's an object, get the value for current view
    const viewConfig = showNavigationButtons[currentView];

    if (viewConfig === undefined) {
      return { nav: false, dateControl: false };
    }

    // If it's a boolean, use it for both nav and date control
    if (typeof viewConfig === "boolean") {
      return { nav: viewConfig, dateControl: viewConfig };
    }

    // If it's an object with nav and dateControl properties
    return {
      nav: viewConfig.nav ?? false,
      dateControl: viewConfig.dateControl ?? false,
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

  const renderView = () => {
    const viewProps = {
      currentDate: selectedDate,
      events,
      validRange,
      onDateChange: handleDateChange,
      onEventClick,
      onEventContextMenu,
      onAddEvent,
      onDensityOverflow,
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
    <div className="flex h-full min-h-0 flex-col">
      <CalendarToolBar
        currentDate={selectedDate}
        currentView={currentView}
        availableViews={availableViews}
        validRange={validRange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onAddEvent={onAddEvent ? () => onAddEvent() : undefined}
        showNavigationButtons={getShowNavigationButtons()}
      />
      {renderView()}
    </div>
  );
};

export default Calendar;
