import { usePresence } from '../../hooks/usePresence';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { UserIndicator } from './UserIndicator';

export function OnlineUsers() {
  const { onlineUsers } = usePresence();
  const authContext = useContext(UserContext);

  // Convert Map to Array for rendering
  const usersArray = Array.from(onlineUsers.values());
  const onlineCount = usersArray.length;


  return (
    <div className="fixed top-20 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 min-w-[220px] max-w-[300px] z-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Online Users</h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {onlineCount}
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="max-h-[400px] overflow-y-auto">
        {onlineCount === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No users online
          </div>
        ) : (
          <div className="py-2">
            {usersArray.map((user) => (
              <UserIndicator
                key={user.uid}
                email={user.email}
                color={user.color}
                isCurrentUser={user.uid === authContext?.user?.uid}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

