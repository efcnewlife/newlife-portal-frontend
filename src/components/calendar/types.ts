export type CalendarView = "day" | "week" | "month";

export interface CalendarEvent {
  id: string | number;
  title: string;
  start: string | Date;
  end: string | Date;
  textColor?: string;
  backgroundColor?: string;
  /** Optional labels (e.g. room names) shown under the title */
  tags?: string[];
  item?: unknown;
}

/** Horizontal placement as percent of the day column. Omitted layout stays full width. */
export interface EventHorizontalLayout {
  leftPercent: number;
  widthPercent: number;
  /** Greedy column index; higher draws on top in the card stack. */
  laneIndex?: number;
}

export interface CalendarDay {
  date: string;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  events?: CalendarEvent[];
}

export interface CalendarMonth {
  name: string;
  days: CalendarDay[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarProps {
  currentDate?: Date;
  defaultView?: CalendarView;
  availableViews?: CalendarView[];
  events?: CalendarEvent[];
  validRange?: DateRange;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventContextMenu?: (event: CalendarEvent, mouseEvent: React.MouseEvent) => void;
  onAddEvent?: (date?: Date, startTime?: string, endTime?: string) => void;
  onDensityOverflow?: (date: Date) => void;
  showNavigationButtons?:
    | boolean
    | {
        month?: boolean | { nav?: boolean; dateControl?: boolean };
        week?: boolean | { nav?: boolean; dateControl?: boolean };
        day?: boolean | { nav?: boolean; dateControl?: boolean };
      }; // Whether to display prev/next and the Calendar date control, by view
}

export interface CalendarViewProps {
  currentDate: Date;
  events?: CalendarEvent[];
  validRange?: DateRange;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventContextMenu?: (event: CalendarEvent, mouseEvent: React.MouseEvent) => void;
  onAddEvent?: (date?: Date, startTime?: string, endTime?: string) => void;
  onDensityOverflow?: (date: Date) => void;
}
