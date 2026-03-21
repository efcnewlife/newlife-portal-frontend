import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { notificationManager } from "@/utils/notificationManager";

type NotificationVariant = "success" | "info" | "warning" | "error";
type NotificationPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface NotificationAction {
  label: string; // Action button label
  onClick: () => void; // Action button click handler
  variant?: "primary" | "secondary" | "danger"; // Action button variant (default: "primary")
}

export interface NotificationItem {
  id: string;
  variant: NotificationVariant;
  title: string;
  description?: string;
  position?: NotificationPosition;
  hideDuration?: number;
  autoClose?: boolean;
  action?: NotificationAction; // Optional action button
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (notification: Omit<NotificationItem, "id">) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (notification: Omit<NotificationItem, "id">): string => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: NotificationItem = {
        id,
        position: "bottom-right",
        autoClose: true,
        hideDuration: 3000,
        ...notification,
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto remove notification after hideDuration if autoClose is true
      if (newNotification.autoClose && newNotification.hideDuration) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.hideDuration);
      }

      return id;
    },
    [removeNotification]
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Register the global notification manager
  useEffect(() => {
    notificationManager.register(showNotification);
    return () => {
      notificationManager.unregister();
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
