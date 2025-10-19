import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EXAMPLE_COMMANDS } from '../../utils/aiExamples';

interface AIInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExampleClick: (example: string) => void;
  cursorX?: number;
  cursorY?: number;
}

export const AIInfoModal = ({ isOpen, onClose, onExampleClick, cursorX = 0, cursorY = 0 }: AIInfoModalProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Update position when modal opens or cursor moves
  useEffect(() => {
    if (isOpen) {
      const modalWidth = 600;
      const modalHeight = 300; // Approximate height
      const padding = 16;

      // Position near cursor, but keep within viewport
      let x = cursorX + padding;
      let y = cursorY + padding;

      // If modal would go off-screen to the right, position to the left of cursor
      if (x + modalWidth > window.innerWidth) {
        x = Math.max(padding, cursorX - modalWidth - padding);
      }

      // If modal would go off-screen at bottom, position above cursor
      if (y + modalHeight > window.innerHeight) {
        y = Math.max(padding, cursorY - modalHeight - padding);
      }

      setPosition({ x, y });
    }
  }, [isOpen, cursorX, cursorY]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleExampleClick = (example: string) => {
    onExampleClick(example);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-y-auto fixed"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">What can AI do?</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {Object.entries(EXAMPLE_COMMANDS).map(([category, examples]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example.text)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 group-hover:text-blue-700">
                        "{example.text}"
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Click any example to copy it to the input field. You can then modify it or send it as-is!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

