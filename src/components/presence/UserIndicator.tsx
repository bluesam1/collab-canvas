interface UserIndicatorProps {
  email: string;
  color: string;
  isCurrentUser?: boolean;
}

export function UserIndicator({ email, color, isCurrentUser = false }: UserIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Colored dot */}
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      
      {/* User email */}
      <span className="text-sm font-medium text-gray-700 truncate">
        {email}
        {isCurrentUser && (
          <span className="ml-2 text-xs text-gray-500">(you)</span>
        )}
      </span>
    </div>
  );
}

