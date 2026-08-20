import { cn } from "@/utils";
import type { ReactNode } from "react";

export interface PageToolbarProps {
  /** Left-aligned content (e.g. view mode switcher). */
  left?: ReactNode;
  /** Right-aligned content (e.g. primary actions). */
  right?: ReactNode;
  /** Optional center content between left and right. */
  center?: ReactNode;
  className?: string;
}

/**
 * Page-level toolbar shell for management screens.
 * Compose arbitrary controls via left / center / right slots.
 */
const PageToolbar = ({ left, right, center, className }: PageToolbarProps) => {
  if (!left && !right && !center) {
    return null;
  }

  return (
    <div className={cn("rounded-full border border-gray-200 bg-white px-2 py-1.5", "dark:border-white/10 dark:bg-white/[0.03]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {(left || center) && (
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {left}
            {center}
          </div>
        )}
        {right ? <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">{right}</div> : null}
      </div>
    </div>
  );
};

export default PageToolbar;
