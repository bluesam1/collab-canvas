import { STANDARD_COLORS } from '../../utils/colors';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
  position?: 'left' | 'right';
}

export function ColorPicker({ selectedColor, onColorChange, onClose, position = 'right' }: ColorPickerProps) {
  const handleColorClick = (color: string) => {
    onColorChange(color);
    onClose();
  };

  return (
    <>
      {/* Backdrop to close picker */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />
      
      {/* Color picker popover */}
      <div className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} bg-gray-800 rounded-lg p-3 border border-gray-700 shadow-xl z-[60]`}>
        <div className="text-xs text-gray-400 mb-2">Choose Color</div>
        <div className="grid grid-cols-10 gap-1 w-80 max-h-80 overflow-y-auto">
          {STANDARD_COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorClick(color)}
              className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                selectedColor === color
                  ? 'border-blue-400 border-2 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </>
  );
}

