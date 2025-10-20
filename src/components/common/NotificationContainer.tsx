import { useNotification } from '../../hooks/useNotification';
import { NotificationItem } from './NotificationItem';

export const NotificationContainer = () => {
  const { notifications, dismissNotification } = useNotification();

  // Only show the 3 most recent notifications
  const visibleNotifications = notifications.slice(-3);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-32 right-6 z-40 flex flex-col gap-2 w-80"
      role="region"
      aria-live="polite"
      aria-label="Activity notifications"
    >
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
};

