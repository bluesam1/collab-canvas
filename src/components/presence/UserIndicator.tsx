import { Settings } from 'lucide-react';

interface UserIndicatorProps {
  email: string;
  color: string;
  isCurrentUser?: boolean;
  isOnline?: boolean;
  onOpenSettings?: () => void;
}

export function UserIndicator({ email, color, isCurrentUser = false, onOpenSettings }: UserIndicatorProps) {
  if (isCurrentUser) {
    return (
      <div className="relative">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
          title={`${email} - Open settings`}
        >
          {/* Colored dot */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-3 h-3 rounded-full ring-2 ring-transparent group-hover:ring-blue-400 transition-all"
              style={{ backgroundColor: color }}
            />
          </div>
          
          {/* User email - with truncation */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
              {email}
            </span>
            <span className="text-xs text-gray-500 group-hover:text-blue-500 flex-shrink-0">(you)</span>
          </div>

          {/* Settings icon */}
          <div className="flex-shrink-0">
            <Settings size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </button>
      </div>
    );
  }

  // Non-current user - not clickable
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors" title={email}>
      {/* Colored dot */}
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      
      {/* User email - with truncation */}
      <span className="text-sm font-medium text-gray-700 truncate flex-1 min-w-0">
        {email}
      </span>
    </div>
  );
}

