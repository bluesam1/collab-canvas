import { Maximize2 } from 'lucide-react';

interface FrameSelectedButtonProps {
  selectedCount: number;
  onClick: () => void;
}

/**
 * Toolbar button to frame (zoom and center) selected shapes
 */
export const FrameSelectedButton = ({ selectedCount, onClick }: FrameSelectedButtonProps) => {
  const isDisabled = selectedCount === 0;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
        ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
        }
      `}
      title={
        isDisabled
          ? 'Select shapes to frame them'
          : `Frame ${selectedCount} selected shape${selectedCount !== 1 ? 's' : ''}`
      }
    >
      <Maximize2 size={18} />
      <span className="text-sm font-medium">Frame Selected</span>
      {selectedCount > 0 && (
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
          {selectedCount}
        </span>
      )}
    </button>
  );
};


