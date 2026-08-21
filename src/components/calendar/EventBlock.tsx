import { cn } from "@/utils";
import { Tooltip } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { formatEventTimeClock, formatEventTimeRange } from "./formatEventTime";
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
    text: "text-gray-900",
    timeText: "text-gray-900",
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
  const timeRangeLabel = formatEventTimeRange(eventStart, eventEnd, locale);
  const timeLabel = height > 48 ? timeRangeLabel : formatEventTimeClock(eventStart, locale);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(event, e);
    }
  };

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
      return "rounded-b-md border-x border-b";
    }
    return "rounded-md border";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick?.(event);
    }
  };

  const tooltipContent = (
    <div className="max-w-xs space-y-0.5 text-start leading-tight">
      <div className="font-semibold">{event.title}</div>
      <div>{timeRangeLabel}</div>
      {tags.length > 0 && <div className="font-normal opacity-90">{tags.join(", ")}</div>}
    </div>
  );

  // 1px vertical inset keeps a hairline gap between stacked events without pushing text down.
  const verticalInsetPx = isSpanning && isContinuing ? 0 : 1;
  const layoutTop = top + (isContinuing ? 0 : verticalInsetPx);
  const layoutHeight = Math.max(height - (isSpanning ? verticalInsetPx : verticalInsetPx * 2), 1);

  return (
    <div
      className={cn("absolute px-1 py-1", horizontalLayout ? "box-border min-w-0 overflow-hidden" : "w-full")}
      style={{
        top: `${layoutTop}px`,
        height: `${layoutHeight}px`,
        ...(horizontalLayout
          ? {
              left: `${horizontalLayout.leftPercent}%`,
              width: `${horizontalLayout.widthPercent}%`,
              zIndex: 10 + (horizontalLayout.laneIndex ?? 0),
            }
          : {}),
      }}
    >
      <Tooltip
        content={tooltipContent}
        placement="top"
        className="!flex h-full w-full"
        contentClassName="pointer-events-none"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onEventClick?.(event)}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          className={cn(
            "relative flex h-full w-full min-w-0 cursor-pointer flex-col justify-start gap-0 overflow-hidden px-1 py-1 leading-none",
            getEventClasses(),
            colorClasses.bg,
            colorClasses.border,
            colorClasses.hoverBg
          )}
          style={inlineStyles}
        >
          <div
            className={cn("truncate text-start text-xs font-semibold leading-none", colorClasses.text)}
            style={inlineStyles.color ? { color: inlineStyles.color } : undefined}
          >
            {event.title}
          </div>
          <div
            className={cn("truncate text-xs leading-none", colorClasses.timeText)}
            style={inlineStyles.color ? { color: inlineStyles.color } : undefined}
          >
            {timeLabel}
          </div>
          {visibleTags.length > 0 && height > 48 && (
            <div
              className={cn("flex max-w-full items-center gap-0.5 text-[10px] leading-none", colorClasses.timeText)}
              style={inlineStyles.color ? { color: inlineStyles.color } : undefined}
            >
              <span className="truncate">{visibleTags.join(", ")}</span>
              {overflowTags.length > 0 && (
                <span className={cn("shrink-0 rounded px-0.5 font-semibold", colorClasses.text)}>
                  +{overflowTags.length}
                </span>
              )}
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export default EventBlock;
