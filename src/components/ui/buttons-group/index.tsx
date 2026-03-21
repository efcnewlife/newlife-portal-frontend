import { cn } from "@/utils";
import { ReactNode } from "react";

export interface ButtonGroupButton {
  text: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

export interface ButtonGroupProps {
  variant?: "primary" | "secondary";
  buttons: ButtonGroupButton[];
  className?: string;
  minWidth?: string;
}

const ButtonGroup = ({ variant = "primary", buttons, className, minWidth = "309px" }: ButtonGroupProps) => {
  const lastIndex = buttons.length - 1;

  const getButtonClassName = (button: ButtonGroupButton, index: number, isActive: boolean) => {
    const baseClasses = "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition first:rounded-l-lg last:rounded-r-lg";
    const isFirstButton = index === 0;
    const isLastButton = index === lastIndex;

    let className = baseClasses;
    switch (variant) {
      case "primary":
        if (isActive) {
          if (isFirstButton) {
            className = cn(className, "border-r border-brand-500 dark:border-brand-600");
          } else if (isLastButton) {
            className = cn(className, "border-l border-brand-500 dark:border-brand-600");
          } else {
            className = cn(className, "border-x border-brand-500 dark:border-brand-600");
          }
          className = cn(className, "bg-brand-500 text-white dark:bg-brand-600");
        } else {
          if (isFirstButton) {
            className = cn(className, "border-r border-gray-200 dark:border-gray-600");
          } else if (isLastButton) {
            className = cn(className, "border-l border-gray-200 dark:border-gray-600");
          } else {
            className = cn(className, "border-x border-gray-200 dark:border-gray-600");
          }
          className = cn(
            className,
            "bg-white text-brand-500 hover:bg-brand-500 hover:text-white dark:bg-transparent dark:text-brand-500 dark:hover:bg-brand-700 dark:hover:text-white"
          );
        }
        className = cn(className, button.className);
        break;
      case "secondary":
        if (isActive) {
          if (isFirstButton) {
            className = cn(className, "border-r border-gray-200 dark:border-gray-600");
          } else if (isLastButton) {
            className = cn(className, "border-l border-gray-200 dark:border-gray-600");
          } else {
            className = cn(className, "border-x border-gray-200 dark:border-gray-600");
          }
          className = cn(className, "bg-white text-gray-800 dark:bg-white/10 dark:text-gray-200");
        } else {
          if (isFirstButton) {
            className = cn(className, "border-r border-gray-200 dark:border-white/10");
          } else if (isLastButton) {
            className = cn(className, "border-l border-gray-200 dark:border-white/10");
          } else {
            className = cn(className, "border-x border-gray-200 dark:border-white/10");
          }
          className = cn(
            className,
            "bg-transparent text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:hover:bg-white/10"
          );
        }
        className = cn(className, button.className);
        break;
      default:
        className = cn(
          baseClasses,
          "text-gray-700 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.03]",
          button.className
        );
        break;
    }

    return className;
  };

  const renderIcon = (button: ButtonGroupButton) => {
    if (!button.icon) return null;

    // For secondary variant, wrap icon in span with specific styling
    if (variant === "secondary") {
      return (
        <span className="fill-gray-800 group-hover:fill-gray-800 dark:fill-gray-200 dark:group-hover:fill-gray-200">{button.icon}</span>
      );
    }

    return button.icon;
  };

  const renderButtonContent = (button: ButtonGroupButton) => {
    const icon = renderIcon(button);
    const iconPosition = button.iconPosition || "left";

    if (!icon) {
      return button.text;
    }

    if (iconPosition === "left") {
      return (
        <>
          {icon}
          {button.text}
        </>
      );
    } else {
      return (
        <>
          {button.text}
          {icon}
        </>
      );
    }
  };

  return (
    <div className={cn("max-w-full pb-3 overflow-x-auto custom-scrollbar", className)}>
      <div style={{ minWidth }}>
        <div className="inline-flex items-center border rounded-lg border-gray-200 dark:border-white/10">
          {buttons.map((button, index) => {
            const isActive = button.active !== undefined ? button.active : index === 0;
            const buttonClassName = getButtonClassName(button, index, isActive);

            return (
              <button
                key={`button-${index}-${button.text}`}
                type="button"
                className={buttonClassName}
                onClick={button.onClick}
                disabled={button.disabled}
              >
                {renderButtonContent(button)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ButtonGroup;
