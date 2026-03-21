import { useTheme } from "@/context/ThemeContext";
import React, { useMemo } from "react";

export type TooltipPlacement = "top" | "right" | "bottom" | "left";
type TooltipTheme = "light" | "dark" | "auto";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  theme?: TooltipTheme;
  enterDelay?: number;
  leaveDelay?: number;
  className?: string;
  /** Tooltip The style class name of the content container (applies only to tooltip Bubbles, does not affect trigger elements) */
  contentClassName?: string;
  wrapContent?: boolean;
}

function getPositionClasses(placement: TooltipPlacement) {
  switch (placement) {
    case "top":
      return {
        container: "bottom-full left-1/2 mb-2.5 -translate-x-1/2",
        arrow: "-bottom-1 left-1/2 -translate-x-1/2",
      };
    case "right":
      return {
        container: "left-full top-1/2 ml-2.5 -translate-y-1/2",
        arrow: "-left-1.5 top-1/2 -translate-y-1/2",
      };
    case "left":
      return {
        container: "right-full top-1/2 mr-2.5 -translate-y-1/2",
        arrow: "-right-1.5 top-1/2 -translate-y-1/2",
      };
    case "bottom":
      return {
        container: "left-1/2 top-full mt-2.5 -translate-x-1/2",
        arrow: "-top-1 left-1/2 -translate-x-1/2",
      };
    default:
      return {
        container: "left-1/2 top-full mt-2.5 -translate-x-1/2",
        arrow: "-top-1 left-1/2 -translate-x-1/2",
      };
  }
}

export default function Tooltip({
  content,
  children,
  placement = "bottom",
  theme = "auto",
  enterDelay = 100,
  leaveDelay = 100,
  className = "",
  contentClassName = "",
  wrapContent = true,
}: TooltipProps) {
  const pos = getPositionClasses(placement);
  const { theme: currentTheme } = useTheme();
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

  // auto: use opposite of current app theme
  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    // theme === 'auto'
    return currentTheme === "light"; // invert
  }, [theme, currentTheme]);

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    if (enterDelay > 0) {
      setTimeoutId(setTimeout(() => {}, enterDelay));
    }
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    if (leaveDelay > 0) {
      setTimeoutId(setTimeout(() => {}, leaveDelay));
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const bubbleClass = isDark ? "bg-[#1E2634] text-white" : "bg-white text-gray-700";
  const arrowBg = isDark ? "bg-[#1E2634]" : "bg-white";

  return (
    <div className={`relative group ${className}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <div
        className={`invisible absolute z-999 group-hover:visible transition-opacity duration-200 ${pos.container} opacity-0 group-hover:opacity-100`}
      >
        <div className={`relative ${contentClassName}`}>
          <div
            className={`drop-shadow-4xl rounded-lg px-3 py-3 text-xs font-medium ${
              wrapContent ? "text-pretty" : "whitespace-nowrap"
            } ${bubbleClass}`}
          >
            {content}
          </div>
          <div className={`absolute ${pos.arrow} h-3 w-4 rotate-45 ${arrowBg}`}></div>
        </div>
      </div>
    </div>
  );
}
