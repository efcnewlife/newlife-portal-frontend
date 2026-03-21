import React, { useCallback, useEffect, useRef, useState } from "react";

import { PopoverPosition } from "@/const/enums";

interface PopoverProps {
  title: React.ReactNode;
  children: React.ReactNode;
  trigger: React.ReactNode;
  position?: PopoverPosition;
  width?: string;
  // controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Popover({
  title,
  children,
  trigger,
  position = PopoverPosition.Bottom,
  width = "300px",
  open,
  onOpenChange,
}: PopoverProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Determine whether to be in controlled mode
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;

  // Unified status update function
  const updateOpenState = useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalIsOpen(newOpen);
      }
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        updateOpenState(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isControlled, onOpenChange, updateOpenState]);

  const togglePopover = () => updateOpenState(!isOpen);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    top_left: "bottom-full left-0 transform -translate-x-1/2 mb-2",
    top_right: "bottom-full right-0 transform -translate-x-1/2 mb-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    right_top: "left-full top-0 transform -translate-y-1/2 ml-2",
    right_bottom: "left-full bottom-0 transform -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    bottom_left: "top-full left-0 transform -translate-x-2 mt-2",
    bottom_right: "top-full right-0 transform -translate-x-2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    left_top: "right-full top-0 transform -translate-y-1/2 mr-2",
    left_bottom: "right-full bottom-0 transform -translate-y-1/2 mr-2",
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={togglePopover}>
        {trigger}
      </div>
      {isOpen && (
        <div ref={popoverRef} className={`absolute z-99999 ${positionClasses[position]}`} style={{ width: width }}>
          <div className="w-full bg-white rounded-xl shadow-2xl dark:bg-[#1E2634]">
            <div className="relative rounded-t-xl border-b border-gray-200 bg-gray-100 px-5 py-3 dark:border-white/[0.03] dark:bg-[#252D3A]">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
