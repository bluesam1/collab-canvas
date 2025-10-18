import { useState } from 'react';
import { usePresence } from '../../hooks/usePresence';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { UserIndicator } from './UserIndicator';
import { UserSettingsModal } from './UserSettingsModal';

export function OnlineUsers() {
  const { onlineUsers } = usePresence();
  const authContext = useContext(UserContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Convert Map to Array for rendering
  const usersArray = Array.from(onlineUsers.values());
  const onlineCount = usersArray.length;

  // Separate current user from others
  const currentUser = usersArray.find(user => user.uid === authContext?.user?.uid);
  const otherUsers = usersArray.filter(user => user.uid !== authContext?.user?.uid);
  const otherUsersCount = otherUsers.length;

  const handleOpenSettings = () => {
    setShowDropdown(false); // Close dropdown when opening settings
    setShowSettings(true);
  };

  return (
    <div className="relative">
      {/* Compact view for navigation bar */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        title={`${onlineCount} user${onlineCount !== 1 ? 's' : ''} online`}
      >
        {currentUser && (
          <>
            {/* Current user's initial */}
            <div
              className="w-7 h-7 rounded-full border-2 border-gray-800 flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: currentUser.color }}
              title={currentUser.email}
            >
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            
            {/* Other users count */}
            {otherUsersCount > 0 && (
              <span className="text-sm font-medium text-gray-300">
                + {otherUsersCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[220px] max-w-[50vw] z-50">
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
                {/* Current user first */}
                {currentUser && (
                  <UserIndicator
                    key={currentUser.uid}
                    email={currentUser.email}
                    color={currentUser.color}
                    isCurrentUser={true}
                    onOpenSettings={handleOpenSettings}
                  />
                )}
                
                {/* Separator if there are other users */}
                {currentUser && otherUsers.length > 0 && (
                  <div className="mx-4 my-2 border-t border-gray-200"></div>
                )}
                
                {/* Other users */}
                {otherUsers.map((user) => (
                  <UserIndicator
                    key={user.uid}
                    email={user.email}
                    color={user.color}
                    isCurrentUser={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

