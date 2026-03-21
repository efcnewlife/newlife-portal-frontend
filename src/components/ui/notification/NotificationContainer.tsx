import { useNotification } from "@/context/NotificationContext";
import Notification from "./index";

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position || "bottom-right";
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, positionNotifications]) => (
        <div key={position} className={`fixed z-[999999] ${getPositionClasses(position)} flex flex-col gap-2`}>
          {positionNotifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{
                animation: "slideIn 0.3s ease-out",
                transform: `translateY(${index * 8}px)`,
              }}
            >
              <Notification
                variant={notification.variant}
                title={notification.title}
                description={notification.description}
                position={notification.position}
                action={notification.action}
                onClose={() => removeNotification(notification.id)}
              />
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

const getPositionClasses = (position: string): string => {
  const positionMap: Record<string, string> = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };
  return positionMap[position] || positionMap["bottom-right"];
};

export default NotificationContainer;
