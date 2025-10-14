import { Hand, Square } from 'lucide-react';
import { ColorPalette } from './ColorPalette';
import { DeleteButton } from './DeleteButton';
import { ModeButton } from './ModeButton';
import { useCanvas } from '../../hooks/useCanvas';

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function Toolbar({ selectedColor, onColorChange }: ToolbarProps) {
  const { mode, setMode } = useCanvas();

  return (
    <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 min-w-[240px]">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Toolbar</h2>
        <p className="text-xs text-gray-600">Create and manage shapes</p>
      </div>

      {/* Mode Buttons */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-700 mb-2">Mode</div>
        <div className="flex gap-2">
          <ModeButton
            icon={<Hand size={24} />}
            label="Pan Mode"
            tooltip="Pan Mode - Click and drag to move canvas"
            shortcut="V"
            isActive={mode === 'pan'}
            onClick={() => setMode('pan')}
          />
          <ModeButton
            icon={<Square size={24} />}
            label="Rectangle Mode"
            tooltip="Rectangle Mode - Click and drag to create rectangles"
            shortcut="R"
            isActive={mode === 'rectangle'}
            onClick={() => setMode('rectangle')}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {mode === 'pan' ? '✋ Pan mode active' : '⬛ Rectangle mode active'}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Color Palette */}
      <div className="mb-4">
        <ColorPalette selectedColor={selectedColor} onColorSelect={onColorChange} />
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
            <span>V</span>
            <span className="font-mono text-gray-500">Pan mode</span>
          </div>
          <div className="flex justify-between">
            <span>R</span>
            <span className="font-mono text-gray-500">Rectangle mode</span>
          </div>
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

