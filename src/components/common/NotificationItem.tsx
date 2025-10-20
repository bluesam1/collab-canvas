import { X, User, UserMinus, Square, Circle, Minus, Type, Trash2, Pencil } from 'lucide-react';
import type { Notification, NotificationType } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

// Get icon for notification type
const getIcon = (type: NotificationType, shapeType?: string) => {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'user-join':
      return <User className={iconClass} />;
    case 'user-leave':
      return <UserMinus className={iconClass} />;
    case 'object-created':
      switch (shapeType) {
        case 'rectangle':
          return <Square className={iconClass} />;
        case 'circle':
          return <Circle className={iconClass} />;
        case 'line':
          return <Minus className={iconClass} />;
        case 'text':
          return <Type className={iconClass} />;
        default:
          return <Square className={iconClass} />;
      }
    case 'object-deleted':
      return <Trash2 className={iconClass} />;
    case 'object-modified':
      return <Pencil className={iconClass} />;
    default:
      return <User className={iconClass} />;
  }
};

// Truncate email if too long
const truncateEmail = (email: string, maxLength: number = 30): string => {
  if (email.length <= maxLength) {
    return email;
  }
  return email.substring(0, maxLength - 3) + '...';
};

export const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 flex items-center gap-3 animate-slide-in-right">
      {/* User color indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: notification.userColor }}
      />
      
      {/* Icon */}
      <div className="flex-shrink-0 text-gray-700">
        {getIcon(notification.type, notification.shapeType)}
      </div>
      
      {/* Message */}
      <div className="flex-1 text-sm text-gray-800">
        <span className="font-medium">{truncateEmail(notification.userEmail)}</span>
        {' '}
        <span>{notification.message}</span>
      </div>
      
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

