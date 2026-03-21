import Tooltip from "@/components/ui/tooltip";
import { useState } from "react";
import { PageButtonType } from "./types";

interface PageButtonProps {
  /** Button configuration */
  button: PageButtonType;
  /** display mode */
  mode: "toolbar" | "contextmenu";
}

export default function PageButton({ button, mode }: PageButtonProps) {
  const {
    key,
    text,
    icon,
    onClick,
    disabled = false,
    loading = false,
    variant = "outline",
    size = "sm",
    tooltip,
    flat = false,
    outline = false,
    className,
    popoverCallback,
    popover,
  } = button;

  // for control Popover status
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Determines display content based on mode
  const showIcon = mode === "toolbar" || mode === "contextmenu";
  const showText = mode === "contextmenu";
  const showTooltip = mode === "toolbar" && (tooltip || text) && !popoverCallback;

  // Style configuration
  const getVariantClasses = () => {
    // If specified outline Parameters, take priority outline style
    if (outline) {
      switch (variant) {
        case "primary":
          return "border border-brand-500 text-brand-500 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10";
        case "success":
          return "border border-green-500 text-green-500 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-500/10";
        case "warning":
          return "border border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-500/10";
        case "danger":
          return "border border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500/10";
        case "info":
          return "border border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500/10";
        case "secondary":
          return "border border-gray-500 text-gray-500 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-500/10";
        case "ghost":
          return "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";
        default:
          return "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";
      }
    }

    // No outline style
    switch (variant) {
      case "primary":
        return "bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700";
      case "success":
        return "bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700";
      case "warning":
        return "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700";
      case "danger":
        return "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700";
      case "info":
        return "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700";
      case "secondary":
        return "bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700";
      case "ghost":
        return "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";
      default:
        return "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";
    }
  };

  const getSizeClasses = () => {
    // Toolbar buttons adopt equal width and equal height to make the appearance more square.
    if (mode === "toolbar") {
      switch (size) {
        case "lg":
          return "w-10 h-10 text-sm";
        case "md":
          return "w-9 h-9 text-sm";
        case "sm":
        default:
          return "w-8 h-8 text-xs";
      }
    }

    // right click menu/Situations such as lists remain as they were padding style
    switch (size) {
      case "lg":
        return "px-4 py-2 text-sm";
      case "md":
        return "px-3 py-1.5 text-sm";
      case "sm":
      default:
        return "px-2 py-1 text-xs";
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-brand-500/20
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${flat ? "shadow-none" : "shadow-theme-xs"}
    ${className || ""}
  `.trim();

  const buttonElement = (
    <button key={key} className={baseClasses} onClick={onClick} disabled={disabled || loading} aria-label={text}>
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && showIcon && icon && <span className="flex-shrink-0">{icon}</span>}
      {showText && text && <span className="whitespace-nowrap">{text}</span>}
    </button>
  );

  const wrappedWithTooltip = showTooltip ? (
    <Tooltip content={tooltip || text} wrapContent={false}>
      <span className="inline-block">{buttonElement}</span>
    </Tooltip>
  ) : (
    buttonElement
  );

  if (mode === "toolbar" && popoverCallback && popover) {
    return (
      <>
        {popoverCallback({
          isOpen: isPopoverOpen,
          onOpenChange: setIsPopoverOpen,
          trigger: wrappedWithTooltip,
          popover: popover,
        })}
      </>
    );
  }

  return wrappedWithTooltip;
}
