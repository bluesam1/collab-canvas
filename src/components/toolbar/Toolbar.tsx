import { useState } from 'react';
import { ColorPalette } from './ColorPalette';
import { DeleteButton } from './DeleteButton';

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function Toolbar({ selectedColor, onColorChange }: ToolbarProps) {
  const [isCreatingMode, setIsCreatingMode] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    // Automatically enter creating mode when a color is selected
    setIsCreatingMode(true);
  };

  return (
    <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 min-w-[240px]">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Toolbar</h2>
        <p className="text-xs text-gray-600">Create and manage shapes</p>
      </div>

      {/* Color Palette */}
      <div className="mb-4">
        <ColorPalette selectedColor={selectedColor} onColorSelect={handleColorSelect} />
      </div>

      {/* Create Button */}
      <div className="mb-4">
        <button
          onClick={() => setIsCreatingMode(!isCreatingMode)}
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isCreatingMode
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          }`}
          title={isCreatingMode ? 'Creating mode active' : 'Enter creating mode'}
        >
          <span className="flex items-center justify-center gap-2">
            {/* Create icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {isCreatingMode ? 'Creating Mode' : 'Create Rectangle'}
          </span>
        </button>
        
        {isCreatingMode && (
          <p className="mt-2 text-xs text-green-700 font-medium animate-pulse">
            ✓ Click and drag on canvas to create
          </p>
        )}
      </div>

      {/* Current Color Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">
          Current Color
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-xs text-gray-600 font-mono">{selectedColor}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Delete Button */}
      <div>
        <DeleteButton />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Keyboard Shortcuts
        </p>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Delete/Backspace</span>
            <span className="font-mono text-gray-500">Delete shape</span>
          </div>
          <div className="flex justify-between">
            <span>Escape</span>
            <span className="font-mono text-gray-500">Deselect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

