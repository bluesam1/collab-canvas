import { Square, Circle, Minus, Type } from 'lucide-react';
import { useCanvas } from '../../hooks/useCanvas';
import type { CanvasMode } from '../../types';

interface ShapeSelectorProps {
  className?: string;
}

export function ShapeSelector({ className = '' }: ShapeSelectorProps) {
  const { mode, setMode } = useCanvas();

  const shapeModes: { mode: CanvasMode; icon: React.ReactNode; label: string; shortcut: string }[] = [
    {
      mode: 'rectangle',
      icon: <Square size={20} />,
      label: 'Rectangle',
      shortcut: 'R'
    },
    {
      mode: 'circle',
      icon: <Circle size={20} />,
      label: 'Circle',
      shortcut: 'C'
    },
    {
      mode: 'line',
      icon: <Minus size={20} />,
      label: 'Line',
      shortcut: 'L'
    },
    {
      mode: 'text',
      icon: <Type size={20} />,
      label: 'Text',
      shortcut: 'T'
    }
  ];

  return (
    <div className={`${className}`}>
      <div className="text-xs font-semibold text-gray-700 mb-2">Shape Tools</div>
      <div className="grid grid-cols-2 gap-2">
        {shapeModes.map(({ mode: shapeMode, icon, label, shortcut }) => (
          <button
            key={shapeMode}
            onClick={() => setMode(shapeMode)}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
              ${mode === shapeMode
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
            title={`${label} - ${shortcut}`}
          >
            {icon}
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs opacity-75">({shortcut})</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {mode === 'pan' && '✋ Pan mode active'}
        {mode === 'rectangle' && '⬛ Rectangle mode active'}
        {mode === 'circle' && '⭕ Circle mode active'}
        {mode === 'line' && '➖ Line mode active'}
        {mode === 'text' && '📝 Text mode active'}
      </p>
    </div>
  );
}
