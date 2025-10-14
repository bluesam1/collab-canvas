import { useState } from 'react';
import type { ReactNode } from 'react';

interface ModeButtonProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltip: string;
  shortcut?: string;
}

export const ModeButton = ({ icon, label, isActive, onClick, tooltip, shortcut }: ModeButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex flex-col items-center justify-center
          w-14 h-14 p-2 rounded-lg
          transition-all duration-200
          ${
            isActive
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={label}
        aria-pressed={isActive}
        title={tooltip}
      >
        <div className="text-xl">{icon}</div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg">
            <div className="font-medium">{tooltip}</div>
            {shortcut && (
              <div className="text-xs text-gray-300 mt-1">
                Press <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">{shortcut}</kbd>
              </div>
            )}
          </div>
          {/* Arrow pointing to button */}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

