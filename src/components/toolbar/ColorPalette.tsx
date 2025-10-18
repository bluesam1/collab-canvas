import { STANDARD_COLORS } from '../../utils/colors';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect?: (color: string) => void;
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  const handleColorClick = (color: string) => {
    onColorSelect?.(color);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-700">
        Shape Color
      </label>
      <div className="flex gap-2">
        {STANDARD_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            className={`w-8 h-8 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${
              selectedColor === color
                ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                : 'hover:ring-1 hover:ring-gray-300'
            }`}
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
}


