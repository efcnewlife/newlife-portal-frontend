import { MdCheckCircle, MdClose, MdError, MdInfo, MdWarning } from "react-icons/md";

interface NotificationAction {
  label: string; // Action button label
  onClick: () => void; // Action button click handler
  variant?: "primary" | "secondary" | "danger"; // Action button variant (default: "primary")
}

interface NotificationProps {
  variant: "success" | "info" | "warning" | "error"; // Notification type
  title: string; // Title text
  description?: string; // Optional description
  position?: string; // Position of the notification on screen (for internal use)
  onClose?: () => void; // Callback when notification is closed
  action?: NotificationAction; // Optional action button
}

const Notification: React.FC<NotificationProps> = ({ variant, title, description, onClose, action }) => {
  // Styling configuration for each alert type
  const variantStyles = {
    success: {
      borderColor: "border-success-500",
      iconBg: "bg-success-50 text-success-500",
      icon: <MdCheckCircle className="size-5" />,
    },
    info: {
      borderColor: "border-blue-light-500",
      iconBg: "bg-blue-light-50 text-blue-light-500",
      icon: <MdInfo className="size-5" />,
    },
    warning: {
      borderColor: "border-warning-500",
      iconBg: "bg-warning-50 text-warning-500",
      icon: <MdWarning className="size-5" />,
    },
    error: {
      borderColor: "border-error-500",
      iconBg: "bg-error-50 text-error-500",
      icon: <MdError className="size-5" />,
    },
  };

  const { borderColor, iconBg, icon } = variantStyles[variant];

  const handleClose = () => {
    onClose?.();
  };

  // Action button styles
  const getActionButtonStyles = (actionVariant: "primary" | "secondary" | "danger" = "primary"): string => {
    const baseStyles = "px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500",
      danger: "bg-error-500 text-white hover:bg-error-600 focus:ring-error-500",
    };
    return `${baseStyles} ${variantStyles[actionVariant]}`;
  };

  const handleActionClick = () => {
    action?.onClick();
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 w-full min-w-[400px] rounded-md border-b-4 p-3 shadow-theme-sm bg-white dark:bg-[#1E2634] ${borderColor}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${iconBg}`}>{icon}</div>

        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm text-gray-800 sm:text-base dark:text-white/90">{title}</h4>
          {description && <p className="mt-1 text-xs text-gray-600 sm:text-sm dark:text-white/70">{description}</p>}
        </div>
      </div>

      {/* Action Button and Close Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <button onClick={handleActionClick} className={getActionButtonStyles(action.variant)}>
            {action.label}
          </button>
        )}
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white/90 flex-shrink-0">
          <MdClose className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
