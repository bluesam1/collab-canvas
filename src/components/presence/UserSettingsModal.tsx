import { useState, useContext } from 'react';
import { X } from 'lucide-react';
import { UserContext } from '../../contexts/UserContext';
import { ColorPicker } from '../common/ColorPicker';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const authContext = useContext(UserContext);
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isOpen || !authContext?.user) return null;

  const handleColorChange = (newColor: string) => {
    if (authContext.changeUserColor) {
      authContext.changeUserColor(newColor);
    }
  };

  const handleLogout = () => {
    if (authContext.logout) {
      authContext.logout();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">User Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Email Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                {authContext.user.email}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Color
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: authContext.user.color || '#000000' }}
                  />
                  <span className="text-sm text-gray-700">
                    {authContext.user.color || '#000000'}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    Click to change
                  </span>
                </button>

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 z-[110]">
                    <ColorPicker
                      selectedColor={authContext.user.color || '#000000'}
                      onColorChange={handleColorChange}
                      onClose={() => setShowColorPicker(false)}
                      position="right"
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This color represents you in the canvas and to other users.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

