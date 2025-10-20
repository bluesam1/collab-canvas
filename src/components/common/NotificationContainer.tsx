import { useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { NotificationItem } from './NotificationItem';

export const NotificationContainer = () => {
  const { notifications, dismissNotification, addNotification } = useNotification();

  // TEST: Add a test notification on mount to verify the system works
  useEffect(() => {
    console.log('[NotificationContainer] Component mounted, testing notification system...');
    
    // Add test notification after 2 seconds
    const timer = setTimeout(() => {
      console.log('[NotificationContainer] Adding TEST notification');
      addNotification({
        type: 'user-join',
        userEmail: 'TEST USER',
        userColor: '#ff0000',
        message: 'TEST NOTIFICATION - System is working!',
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [addNotification]);

  console.log('[NotificationContainer] Rendering with notifications:', notifications.length);

  // Only show the 3 most recent notifications
  const visibleNotifications = notifications.slice(-3);

  if (visibleNotifications.length === 0) {
    console.log('[NotificationContainer] No visible notifications, returning null');
    return null;
  }
  
  console.log('[NotificationContainer] Showing notifications:', visibleNotifications.map(n => n.type));

  return (
    <>
      {/* DEBUG: Always visible indicator that container is rendering */}
      <div 
        className="fixed top-24 right-6 z-50 bg-green-500 text-white text-xs px-2 py-1 rounded"
        style={{ pointerEvents: 'none' }}
      >
        Notification System Active ({notifications.length})
      </div>
      
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
    </>
  );
};

