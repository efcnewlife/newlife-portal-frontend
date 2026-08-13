import { Tooltip } from "@efcnewlife/newlife-ui";
import { cn } from "@/utils";
import { useTranslation } from "react-i18next";
import { CalendarEvent, EventHorizontalLayout } from "./types";

const MAX_VISIBLE_TAGS = 2;

export interface EventColorClasses {
  bg: string;
  border: string;
  hoverBg: string;
  text: string;
  timeText: string;
}

export interface EventColorStyles {
  backgroundColor?: string;
  color?: string;
}

/**
 * Get default event color classes based on color name
 */
const getDefaultColorClasses = (): EventColorClasses => {
  return {
    bg: "bg-brand-50",
    border: "border-brand-200",
    hoverBg: "hover:bg-brand-100",
    text: "text-brand-500",
    timeText: "text-brand-400",
  };
};

export interface EventBlockProps {
  event: CalendarEvent;
  top: number;
  height: number;
  isSpanning?: boolean; // Event spans to next day
  isContinuing?: boolean; // Event continues from previous day
  isFullDay?: boolean; // Event is fully within this day
  dayDate?: Date; // The date this event block represents
  horizontalLayout?: EventHorizontalLayout;
  onEventClick?: (event: CalendarEvent) => void;
  onContextMenu?: (event: CalendarEvent, mouseEvent: React.MouseEvent) => void;
}

/**
 * Event block component for rendering calendar events
 */
const EventBlock = ({
  event,
  top,
  height,
  isSpanning,
  isContinuing,
  horizontalLayout,
  onEventClick,
  onContextMenu,
}: EventBlockProps) => {
  const { i18n } = useTranslation("calendar");
  const locale = i18n.language || "en";
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const tags = event.tags?.filter(Boolean) || [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowTags = tags.slice(MAX_VISIBLE_TAGS);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(event, e);
    }
  };

  // Always display original event times
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.startsWith("en"),
  };
  const startTimeString = eventStart.toLocaleTimeString(locale, timeOptions);
  const endTimeString = eventEnd.toLocaleTimeString(locale, timeOptions);

  // Get default classes based on preset color name (if any)
  const defaultClasses = getDefaultColorClasses();

  // Build inline styles for custom colors
  // Normalize color values (trim whitespace, ensure proper format)
  const inlineStyles: EventColorStyles = {};
  if (event.backgroundColor) {
    inlineStyles.backgroundColor = event.backgroundColor.trim();
  }
  if (event.textColor) {
    inlineStyles.color = event.textColor.trim();
  }

  const colorClasses: EventColorClasses = {
    bg: event.backgroundColor ? "" : defaultClasses.bg,
    border: defaultClasses.border,
    hoverBg: event.backgroundColor ? "hover:brightness-95" : defaultClasses.hoverBg,
    text: event.textColor ? "" : defaultClasses.text,
    timeText: event.textColor ? "" : defaultClasses.timeText,
  };

  // Determine rounded corners based on event state
  // - isSpanning: remove bottom rounded (event continues to next day)
  // - isContinuing: remove top rounded (event continues from previous day)
  // - Both: remove both top and bottom rounded
  // - Neither: keep all rounded (default)
  const getEventClasses = (): string => {
    if (isSpanning && isContinuing) {
      return "border-x";
    } else if (isSpanning) {
      return "rounded-t-md border-x border-t";
    } else if (isContinuing) {
      return "rounded-b-md pt-3 border-x border-b";
    }
    return "rounded-md border";
  };

  const getPaddingClasses = (): string => {
    if (isSpanning && isContinuing) {
      return "px-1.5";
    } else if (isSpanning) {
      return "pt-2 px-1.5";
    } else if (isContinuing) {
      return "px-1.5 pb-1.5";
    }
    return "px-1.5 py-1.5";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick?.(event);
    }
  };

  return (
    <div
      className={cn(
        "absolute",
        horizontalLayout ? "z-10 box-border min-w-0 overflow-hidden" : "w-full",
        getPaddingClasses(),
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: horizontalLayout ? `${horizontalLayout.leftPercent}%` : 0,
        width: horizontalLayout ? `${horizontalLayout.widthPercent}%` : "100%",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEventClick?.(event)}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex h-full w-full flex-1 cursor-pointer flex-col gap-0.5",
          getEventClasses(),
          "px-1 py-0.5",
          colorClasses.bg,
          colorClasses.border,
          colorClasses.hoverBg,
          "relative",
        )}
        style={inlineStyles}
      >
        <div className="flex w-full flex-col items-start relative">
          <div className="flex w-full flex-col items-start gap-0.5">
            <div
              className={cn("text-xs font-semibold text-start", colorClasses.text)}
              style={inlineStyles.color ? { color: inlineStyles.color } : undefined}
            >
              {event.title}
            </div>
            {visibleTags.length > 0 && height > 28 && (
              <div
                className={cn("flex max-w-full items-center gap-0.5 text-[10px] leading-tight", colorClasses.timeText)}
                style={inlineStyles.color ? { color: inlineStyles.color } : undefined}
              >
                <span className="truncate">{visibleTags.join(", ")}</span>
                {overflowTags.length > 0 && (
                  <Tooltip content={overflowTags.join(", ")} placement="top">
                    <span className={cn("shrink-0 rounded px-0.5 font-semibold", colorClasses.text)}>
                      +{overflowTags.length}
                    </span>
                  </Tooltip>
                )}
              </div>
            )}
            <div className={cn("text-xs", colorClasses.timeText)} style={inlineStyles.color ? { color: inlineStyles.color } : undefined}>
              {startTimeString}
              {height > 48 && ` – ${endTimeString}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventBlock;
