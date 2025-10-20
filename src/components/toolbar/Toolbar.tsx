import { useState } from 'react';
import { Square, Circle, Type, Trash2, Droplet, Slash, Info, Hand, BoxSelect, Lasso, Maximize2, Undo, ZoomIn, ZoomOut, Redo, Download, Copy, Clipboard, CopyPlus } from 'lucide-react';
import { useCanvas } from '../../hooks/useCanvas';
import { isLine } from '../../types';
import { STANDARD_COLORS } from '../../utils/colors';

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  lineThickness: number;
  onLineThicknessChange: (thickness: number) => void;
  showInfo: boolean;
  onToggleInfo: () => void;
  onBackToCanvasList: () => void;
  onFrameSelected?: () => void;
  onDeleteSelected?: () => void;
  onExport: () => void;
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function Toolbar({ selectedColor, onColorChange, lineThickness, onLineThicknessChange, showInfo, onToggleInfo, onBackToCanvasList: _onBackToCanvasList, onFrameSelected, onDeleteSelected, onExport, currentZoom, onZoomIn, onZoomOut, onZoomReset }: ToolbarProps) {
  const { mode, setMode, selectedIds, deleteSelected, updateObject, objects, clearSelection, undo, undoState, redo, redoState, handleCopy, handleDuplicate } = useCanvas();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeWidthMenu, setShowStrokeWidthMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

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

  const shapeTools = [
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle (R)' },
    { id: 'circle' as const, icon: Circle, label: 'Circle (C)' },
    { id: 'text' as const, icon: Type, label: 'Text (T)' },
    { id: 'line' as const, icon: Slash, label: 'Line (/)' },
  ];

  const strokeWidthOptions = [1, 2, 3, 4, 6, 8, 12, 16, 20, 24];

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      // Use poof effect if available, otherwise regular delete
      if (onDeleteSelected) {
        onDeleteSelected();
      } else {
        deleteSelected();
      }
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

  return (
    <div className="fixed top-16 left-0 bottom-0 z-20 w-16 bg-gray-800 shadow-lg flex flex-col items-center gap-2" style={{ paddingTop: '8px' }}>
      {/* Color Picker Group */}
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

      {/* View Controls Group */}
      <div className="flex flex-col gap-1">
        {/* Pan Mode */}
        <button
          onClick={() => handleModeChange('pan')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
            mode === 'pan'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Pan (V) - Hold Space to temporarily pan"
        >
          <Hand size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            Pan (V) - Hold Space to pan
          </span>
        </button>

        {/* Multi-Select Mode */}
        <button
          onClick={() => handleModeChange('select')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
            mode === 'select'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Multi-Select (S)"
        >
          <BoxSelect size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            Multi-Select (S)
          </span>
        </button>

        {/* Lasso Select Mode */}
        <button
          onClick={() => handleModeChange('lasso')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
            mode === 'lasso'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Lasso Select (L)"
        >
          <Lasso size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            Lasso Select (L)
          </span>
        </button>

        {/* Zoom Menu */}
        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
              showZoomMenu
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={`Zoom: ${(currentZoom * 100).toFixed(0)}%`}
          >
            <div className="text-[10px] font-bold">{(currentZoom * 100).toFixed(0)}%</div>
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
              Zoom
            </span>
          </button>

          {showZoomMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowZoomMenu(false)}
              />
              {/* Zoom menu flyout */}
              <div className="absolute left-full bottom-0 ml-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-40 min-w-[160px]">
                <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700 font-mono">
                  Zoom Controls
                </div>
                <button
                  onClick={() => {
                    onZoomIn();
                    setShowZoomMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <ZoomIn size={16} />
                  Zoom In
                </button>
                <button
                  onClick={() => {
                    onZoomReset();
                    setShowZoomMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <div className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-white rounded">
                    1x
                  </div>
                  Reset to 100%
                </button>
                <button
                  onClick={() => {
                    onZoomOut();
                    setShowZoomMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <ZoomOut size={16} />
                  Zoom Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Frame Selected */}
        <button
          onClick={onFrameSelected}
          disabled={selectedIds.length === 0}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
            selectedIds.length > 0
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          title={selectedIds.length > 0 ? `Frame ${selectedIds.length} shape${selectedIds.length > 1 ? 's' : ''}` : 'Select shapes to frame'}
        >
          <Maximize2 size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
            {selectedIds.length > 0 ? `Frame Selected (${selectedIds.length})` : 'Frame Selected'}
          </span>
        </button>
      </div>

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

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          selectedIds.length > 0
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title="Delete"
      >
        <Trash2 size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Delete
        </span>
      </button>

      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!undoState}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          undoState
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={undoState ? `Undo ${undoState.operation} (Ctrl/Cmd+Z)` : 'Nothing to undo'}
      >
        <Undo size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          {undoState ? `Undo ${undoState.operation.charAt(0).toUpperCase() + undoState.operation.slice(1)}` : 'Nothing to undo'}
        </span>
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!redoState}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          redoState
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={redoState ? `Redo ${redoState.operation} (Ctrl/Cmd+Y)` : 'Nothing to redo'}
      >
        <Redo size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          {redoState ? `Redo ${redoState.operation.charAt(0).toUpperCase() + redoState.operation.slice(1)}` : 'Nothing to redo'}
        </span>
      </button>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={selectedIds.length === 0}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          selectedIds.length > 0
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={selectedIds.length > 0 ? `Copy (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+C)` : 'Select shapes to copy'}
      >
        <Copy size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          {selectedIds.length > 0 ? `Copy (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+C)` : 'Select shapes to copy'}
        </span>
      </button>

      {/* Paste Button */}
      <button
        onClick={() => {
          // Dispatch event so CanvasEditorPage can provide viewport center
          window.dispatchEvent(new CustomEvent('toolbar-paste'));
        }}
        className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative text-gray-400 hover:text-white hover:bg-gray-700"
        title={`Paste (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+V)`}
      >
        <Clipboard size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Paste ({navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+V)
        </span>
      </button>

      {/* Duplicate Button */}
      <button
        onClick={handleDuplicate}
        disabled={selectedIds.length === 0}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative ${
          selectedIds.length > 0
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={selectedIds.length > 0 ? `Duplicate (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+D)` : 'Select shapes to duplicate'}
      >
        <CopyPlus size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          {selectedIds.length > 0 ? `Duplicate (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+D)` : 'Select shapes to duplicate'}
        </span>
      </button>

      {/* Spacer to push bottom buttons */}
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

      {/* Export Button */}
      <button
        onClick={onExport}
        className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors group relative text-gray-400 hover:text-white hover:bg-gray-700"
        title={`Export canvas as PNG (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+E)`}
      >
        <Download size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-30">
          Export PNG ({navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+E)
        </span>
      </button>
    </div>
  );
}
