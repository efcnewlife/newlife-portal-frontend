import { useEffect, useState } from "react";
import CalendarToolBar from "./CalendarToolbar";
import DayView from "./DayView";
import { shiftMonthPreservingDay } from "./monthLayout";
import MonthView from "./MonthView";
import { CalendarProps, CalendarView } from "./types";
import WeekView from "./WeekView";

const resolveInitialView = (availableViews: CalendarView[], preferred: CalendarView): CalendarView => {
  if (availableViews.includes(preferred)) {
    return preferred;
  }
  return availableViews[0] || "month";
};

const Calendar = ({
  currentDate = new Date(),
  view,
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

  const [uncontrolledView, setUncontrolledView] = useState<CalendarView>(() =>
    resolveInitialView(availableViews, defaultView)
  );
  const currentView = view !== undefined ? resolveInitialView(availableViews, view) : uncontrolledView;

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
      if (view === undefined) {
        setUncontrolledView(fallbackView);
      }
      onViewChange?.(fallbackView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableViews]);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleViewChange = (newView: CalendarView) => {
    if (view === undefined) {
      setUncontrolledView(newView);
    }
    onViewChange?.(newView);
  };

  const handlePrevious = () => {
    switch (currentView) {
      case "day": {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        handleDateChange(newDate);
        break;
      }
      case "week": {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        handleDateChange(newDate);
        break;
      }
      case "month":
        handleDateChange(shiftMonthPreservingDay(selectedDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case "day": {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        handleDateChange(newDate);
        break;
      }
      case "week": {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        handleDateChange(newDate);
        break;
      }
      case "month":
        handleDateChange(shiftMonthPreservingDay(selectedDate, 1));
        break;
    }
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
