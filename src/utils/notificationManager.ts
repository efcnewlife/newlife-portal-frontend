import type { NotificationItem } from "@/context/NotificationContext";

type ShowNotificationFn = (notification: Omit<NotificationItem, "id">) => string;

// Global notification manager - for non- React Show notification in component
class NotificationManager {
  private showNotificationFn: ShowNotificationFn | null = null;

  // Register notification function (provided by NotificationProvider call)
  register(showNotification: ShowNotificationFn): void {
    this.showNotificationFn = showNotification;
  }

  // Unregister
  unregister(): void {
    this.showNotificationFn = null;
  }

  // Show notifications (can be called from anywhere)
  show(notification: Omit<NotificationItem, "id">): string | null {
    if (!this.showNotificationFn) {
      console.warn("NotificationManager: showNotification function not registered");
      return null;
    }
    return this.showNotificationFn(notification);
  }
}

// Export singleton
export const notificationManager = new NotificationManager();

