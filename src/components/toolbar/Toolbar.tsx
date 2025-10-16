import { useState } from 'react';
import { Square, Circle, Type, Trash2, Droplet, Minus, Info, ArrowLeft, MousePointer } from 'lucide-react';
import { useCanvas } from '../../hooks/useCanvas';

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  showInfo: boolean;
  onToggleInfo: () => void;
  onBackToCanvasList: () => void;
}

// Standard color palette - 100 colors
const STANDARD_COLORS = [
  // Grayscale
  '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6', '#FFFFFF',
  
  // Reds
  '#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC', '#CC0000', '#990000', '#660000', '#330000', '#FF6666',
  
  // Oranges
  '#FF8000', '#FF9933', '#FFB366', '#FFCC99', '#FFE6CC', '#CC6600', '#994D00', '#663300', '#331A00', '#FFB366',
  
  // Yellows
  '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#CCCC00', '#999900', '#666600', '#333300', '#FFFF66',
  
  // Greens
  '#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC', '#00CC00', '#009900', '#006600', '#003300', '#66FF66',
  
  // Cyans
  '#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF', '#00CCCC', '#009999', '#006666', '#003333', '#66FFFF',
  
  // Blues
  '#0000FF', '#3333FF', '#6666FF', '#9999FF', '#CCCCFF', '#0000CC', '#000099', '#000066', '#000033', '#6666FF',
  
  // Purples
  '#8000FF', '#9933FF', '#B366FF', '#CC99FF', '#E6CCFF', '#6600CC', '#4D0099', '#330066', '#1A0033', '#B366FF',
  
  // Magentas
  '#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF', '#CC00CC', '#990099', '#660066', '#330033', '#FF66FF',
  
  // Browns
  '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#654321', '#4A2C2A', '#2F1B14', '#1A0F0A', '#CD853F',
  
  // Pinks
  '#FFC0CB', '#FFB6C1', '#FFA0B4', '#FF8FA3', '#FF7F92', '#FF69B4', '#FF1493', '#DC143C', '#B22222', '#FF8FA3'
];

export function Toolbar({ selectedColor, onColorChange, showInfo, onToggleInfo, onBackToCanvasList }: ToolbarProps) {
  const { mode, setMode, selectedIds, deleteObject } = useCanvas();
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Calculate if color is light or dark to determine icon color
  const getContrastColor = (hexColor: string): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const iconColor = getContrastColor(selectedColor);

  const navigationTools = [
    { id: 'pan' as const, icon: MousePointer, label: 'Navigation (V)' },
  ];

  const shapeTools = [
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle (R)' },
    { id: 'circle' as const, icon: Circle, label: 'Circle (C)' },
    { id: 'line' as const, icon: Minus, label: 'Line (L)' },
    { id: 'text' as const, icon: Type, label: 'Text (T)' },
  ];

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      deleteObject(selectedIds[0]);
    }
  };

  return (
    <div className="fixed top-0 left-0 bottom-0 z-20 w-16 bg-gray-800 shadow-lg flex flex-col items-center gap-2" style={{ paddingTop: '8px' }}>
      {/* Back to Canvas List Button */}
      <button
        onClick={onBackToCanvasList}
        className="w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative text-gray-400 hover:text-white hover:bg-gray-700"
        title="Back to Canvas List"
      >
        <ArrowLeft size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Back to Canvas List
        </span>
      </button>

      {/* Divider */}
      <div className="w-10 h-px bg-gray-700 my-1" />

      {/* Navigation Tools */}
      {navigationTools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
              mode === tool.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={tool.label}
          >
            <Icon size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
              {tool.label}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-10 h-px bg-gray-700 my-1" />

      {/* Shape Tools */}
      {shapeTools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
              mode === tool.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={tool.label}
          >
            <Icon size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
              {tool.label}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-10 h-px bg-gray-700 my-1" />

      {/* Color Picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:brightness-110 group relative border-2 border-gray-700"
          title="Color"
          style={{ backgroundColor: selectedColor }}
        >
          <Droplet size={20} fill={iconColor} stroke={iconColor} strokeWidth={1} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            Color
          </span>
        </button>

        {showColorPicker && (
          <>
            {/* Backdrop to close picker */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowColorPicker(false)}
            />
            {/* Color picker popover */}
            <div className="absolute left-full ml-2 bg-gray-800 rounded-lg p-3 border border-gray-700 shadow-xl z-40">
              <div className="text-xs text-gray-400 mb-2">Choose Color</div>
              <div className="grid grid-cols-10 gap-1 w-80 max-h-80 overflow-y-auto">
                {STANDARD_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                      selectedColor === color 
                        ? 'border-white shadow-lg' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-2">Current</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-600"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-xs text-white font-mono">{selectedColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-gray-700 my-1" />

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          selectedIds.length > 0
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title="Delete"
      >
        <Trash2 size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Delete
        </span>
      </button>

      {/* Spacer to push info button to bottom */}
      <div className="flex-1" />

      {/* Info Button */}
      <button
        onClick={onToggleInfo}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          showInfo
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="Info"
      >
        <Info size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Info
        </span>
      </button>
    </div>
  );
}
