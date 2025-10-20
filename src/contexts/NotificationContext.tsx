import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Notification, NotificationContextType } from '../types';

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationContextProviderProps {
  children: ReactNode;
}

export const NotificationContextProvider = ({ children }: NotificationContextProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID for notifications
  const generateId = (): string => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: Date.now(),
    };

    setNotifications(prev => {
      // Keep only the 3 most recent notifications (oldest dismissed automatically)
      const updated = [...prev, newNotification];
      return updated.slice(-3);
    });

    // Auto-dismiss based on notification type
    const duration = notification.type === 'user-join' || notification.type === 'user-leave' ? 3000 : 2000;
    
    setTimeout(() => {
      dismissNotification(newNotification.id);
    }, duration);
  }, []);

  // Dismiss a specific notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clean up old notifications (safety measure, though auto-dismiss handles most cases)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(n => now - n.timestamp < 30000) // Remove notifications older than 30 seconds
      );
    }, 10000); // Check every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    dismissNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

