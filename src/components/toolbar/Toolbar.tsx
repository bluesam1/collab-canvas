import { useState } from 'react';
import { Square, Circle, Type, Trash2, Droplet, Slash, Info, ArrowLeft, Hand, Terminal, BoxSelect } from 'lucide-react';
import { useCanvas } from '../../hooks/useCanvas';
import { isLine } from '../../types';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  lineThickness: number;
  onLineThicknessChange: (thickness: number) => void;
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

export function Toolbar({ selectedColor, onColorChange, lineThickness, onLineThicknessChange, showInfo, onToggleInfo, onBackToCanvasList }: ToolbarProps) {
  const { mode, setMode, selectedIds, deleteSelected, updateObject, objects, createObject, clearSelection } = useCanvas();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeWidthMenu, setShowStrokeWidthMenu] = useState(false);
  const [showHackerMenu, setShowHackerMenu] = useState(false);
  const authContext = useContext(UserContext);

  // Determine if only lines are selected
  const selectedShapes = objects.filter(obj => selectedIds.includes(obj.id));
  const hasLinesSelected = selectedIds.length > 0 && selectedShapes.some(shape => isLine(shape));
  
  // Show stroke width selector when in line mode or when lines are selected
  const shouldShowStrokeWidth = mode === 'line' || hasLinesSelected;

  // Handle mode change - clear selection when switching to create modes
  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    // Clear selection when switching to any create mode
    if (newMode !== 'pan') {
      clearSelection();
    }
  };

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
    { id: 'pan' as const, icon: Hand, label: 'Pan (V)' },
    { id: 'select' as const, icon: BoxSelect, label: 'Multi-Select (S)' },
  ];

  const shapeTools = [
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle (R)' },
    { id: 'circle' as const, icon: Circle, label: 'Circle (C)' },
    { id: 'text' as const, icon: Type, label: 'Text (T)' },
    { id: 'line' as const, icon: Slash, label: 'Line (L)' },
  ];

  const strokeWidthOptions = [1, 2, 3, 4, 6, 8, 12, 16, 20, 24];

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      deleteSelected();
    }
  };

  const handleColorChange = (color: string) => {
    // Update color for all selected shapes
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const shape = objects.find(obj => obj.id === id);
        if (shape) {
          // Update color based on shape type
          if (shape.type === 'line') {
            updateObject(id, { stroke: color });
          } else {
            updateObject(id, { fill: color });
          }
        }
      });
    }
    // Also update the selected color for new shapes
    onColorChange(color);
    setShowColorPicker(false);
  };

  const handleLineThicknessChange = (thickness: number) => {
    // Update thickness for all selected lines
    if (hasLinesSelected) {
      selectedIds.forEach(id => {
        const shape = objects.find(obj => obj.id === id);
        if (shape && isLine(shape)) {
          updateObject(id, { strokeWidth: thickness });
        }
      });
    }
    // Also update the default line thickness for new lines
    onLineThicknessChange(thickness);
    // Close the menu after selection
    setShowStrokeWidthMenu(false);
  };

  const handleCreate100Shapes = () => {
    if (!authContext?.user) return;

    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
      'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat'
    ];

    const random = (min: number, max: number) => Math.random() * (max - min) + min;
    const randomInt = (min: number, max: number) => Math.floor(random(min, max));
    const randomColor = () => STANDARD_COLORS[randomInt(0, STANDARD_COLORS.length)];
    const randomWords = (count: number) => {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[randomInt(0, loremWords.length)]);
      }
      return words.join(' ');
    };

    // Create 25 of each shape type
    for (let i = 0; i < 25; i++) {
      // Rectangle
      createObject({
        type: 'rectangle',
        x: random(-500, 1500),
        y: random(-500, 1500),
        width: random(50, 300),
        height: random(50, 300),
        fill: randomColor(),
        rotation: random(0, 360),
        createdBy: authContext.user.uid,
      });

      // Circle
      createObject({
        type: 'circle',
        centerX: random(-500, 1500),
        centerY: random(-500, 1500),
        radius: random(25, 150),
        fill: randomColor(),
        rotation: random(0, 360),
        createdBy: authContext.user.uid,
      });

      // Line
      const lineLength = random(50, 400);
      createObject({
        type: 'line',
        x: random(-500, 1500),
        y: random(-500, 1500),
        width: lineLength,
        height: 0,
        stroke: randomColor(),
        strokeWidth: [1, 2, 3, 4, 6, 8, 12, 16, 20, 24][randomInt(0, 10)],
        rotation: random(0, 360),
        createdBy: authContext.user.uid,
      });

      // Text
      const wordCount = randomInt(1, 4); // 1-3 words
      createObject({
        type: 'text',
        x: random(-500, 1500),
        y: random(-500, 1500),
        text: randomWords(wordCount),
        fontSize: randomInt(12, 72),
        fill: randomColor(),
        rotation: random(0, 360),
        bold: Math.random() > 0.5,
        italic: Math.random() > 0.7,
        underline: Math.random() > 0.8,
        createdBy: authContext.user.uid,
      });
    }

    setShowHackerMenu(false);
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
            onClick={() => handleModeChange(tool.id)}
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
            onClick={() => handleModeChange(tool.id)}
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

      {/* Stroke Width Control (shows when in line mode or lines selected) */}
      {shouldShowStrokeWidth && (
        <div className="relative">
          <button
            onClick={() => setShowStrokeWidthMenu(!showStrokeWidthMenu)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
              showStrokeWidthMenu
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Line Thickness"
          >
            <div 
              className="bg-white rounded-full"
              style={{ 
                width: `${lineThickness}px`, 
                height: `${lineThickness}px`,
                minWidth: `${lineThickness}px`,
                minHeight: `${lineThickness}px`
              }} 
            />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
              Line Thickness ({lineThickness}px)
            </span>
          </button>

          {showStrokeWidthMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowStrokeWidthMenu(false)}
              />
              {/* Stroke width menu */}
              <div className="absolute left-full top-0 ml-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-40 p-2 flex flex-col items-center gap-1">
                {strokeWidthOptions.map((width) => (
                  <button
                    key={width}
                    onClick={() => handleLineThicknessChange(width)}
                    className={`w-10 h-10 rounded flex items-center justify-center transition-all hover:bg-gray-700 ${
                      lineThickness === width 
                        ? 'bg-blue-600' 
                        : 'bg-gray-900'
                    }`}
                    title={`${width}px`}
                  >
                    <div 
                      className="bg-white rounded-full"
                      style={{ 
                        width: `${width}px`, 
                        height: `${width}px`,
                        minWidth: `${width}px`,
                        minHeight: `${width}px`
                      }} 
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
                {STANDARD_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(color)}
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
                <div className="text-xs text-gray-400 mb-2">
                  Current {selectedIds.length > 0 && `(click to apply to ${selectedIds.length} shape${selectedIds.length > 1 ? 's' : ''})`}
                </div>
                <button
                  onClick={() => handleColorChange(selectedColor)}
                  disabled={selectedIds.length === 0}
                  className={`flex items-center gap-2 w-full p-1 rounded transition-all ${
                    selectedIds.length > 0 
                      ? 'hover:bg-gray-700 cursor-pointer' 
                      : 'cursor-default opacity-60'
                  }`}
                  title={selectedIds.length > 0 ? 'Click to apply this color to selected shapes' : 'Select shapes to apply color'}
                >
                  <div
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedIds.length > 0 ? 'border-gray-600 hover:border-blue-500' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-xs text-white font-mono">{selectedColor.toUpperCase()}</span>
                </button>
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

      {/* Hacker Menu Button */}
      <div className="relative">
        <button
          onClick={() => setShowHackerMenu(!showHackerMenu)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
            showHackerMenu
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Developer Tools"
        >
          <Terminal size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            Developer Tools
          </span>
        </button>

        {showHackerMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowHackerMenu(false)}
            />
            {/* Hacker menu flyout */}
            <div className="absolute left-full bottom-0 ml-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-40 min-w-[200px]">
              <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700 font-mono">
                Developer Tools
              </div>
              <button
                onClick={handleCreate100Shapes}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2 font-mono"
              >
                <Terminal size={14} className="text-green-400" />
                Create 100
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
