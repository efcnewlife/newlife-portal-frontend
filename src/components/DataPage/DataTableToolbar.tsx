import { ToolbarButtonGroup } from "./PageButtonGroup";
import { PageButtonType } from "./types";

interface DataTableToolbarProps {
  /** Toolbar buttons */
  buttons?: PageButtonType[];
  /** Resource name (for permission checks) */
  resource?: string;
  /** Container CSS class name */
  className?: string;
}

export default function DataTableToolbar({ buttons = [], resource, className }: DataTableToolbarProps) {
  // Group by align (default: left)
  const leftButtons = (buttons || []).filter((b) => !b.align || b.align === "left");
  const rightButtons = (buttons || []).filter((b) => b.align === "right");

  // Hide toolbar when there are no buttons
  if (leftButtons.length === 0 && rightButtons.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex gap-2 px-4 py-4 border border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between ${
        className || ""
      }`}
    >
      {/* Left: action buttons (align: left or unspecified) */}
      <div className="flex gap-3 sm:flex-row sm:items-center">
        {leftButtons.length > 0 && <ToolbarButtonGroup buttons={leftButtons} resource={resource} align="left" gap="md" />}
      </div>

      <div className="flex items-center gap-2">
        {/* Right: action buttons (align: right) */}
        {rightButtons.length > 0 && <ToolbarButtonGroup buttons={rightButtons} resource={resource} align="right" gap="md" />}
      </div>
    </div>
  );
}
