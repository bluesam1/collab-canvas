import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, ChevronUp, ChevronDown, Droplet } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';

interface TextEditModalProps {
  isOpen: boolean;
  initialText: string;
  initialFontSize?: number;
  initialBold?: boolean;
  initialItalic?: boolean;
  initialUnderline?: boolean;
  initialColor?: string;
  onSave: (text: string, fontSize: number, bold: boolean, italic: boolean, underline: boolean, color: string) => void | Promise<void>;
  onCancel: () => void;
}

export function TextEditModal({ 
  isOpen, 
  initialText, 
  initialFontSize = 24,
  initialBold = false,
  initialItalic = false,
  initialUnderline = false,
  initialColor = '#000000',
  onSave, 
  onCancel 
}: TextEditModalProps) {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontSizeInput, setFontSizeInput] = useState(initialFontSize.toString());
  const [bold, setBold] = useState(initialBold);
  const [italic, setItalic] = useState(initialItalic);
  const [underline, setUnderline] = useState(initialUnderline);
  const [color, setColor] = useState(initialColor);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(initialText);
    setFontSize(initialFontSize);
    setFontSizeInput(initialFontSize.toString());
    setBold(initialBold);
    setItalic(initialItalic);
    setUnderline(initialUnderline);
    setColor(initialColor);
    setPreviewPan({ x: 0, y: 0 }); // Reset pan when modal opens
  }, [initialText, initialFontSize, initialBold, initialItalic, initialUnderline, initialColor]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setShowSizeDropdown(false);
      }
    };

    if (showSizeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSizeDropdown]);

  // Render preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !text.trim()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw text with pan offset
    ctx.save();
    ctx.translate(previewPan.x, previewPan.y);

    // Center text initially
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Set font properties
    let fontString = '';
    if (bold && italic) fontString = 'bold italic ';
    else if (bold) fontString = 'bold ';
    else if (italic) fontString = 'italic ';
    fontString += `${fontSize}px Arial, sans-serif`;
    ctx.font = fontString;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add shadow for visibility (especially for light colors)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw text
    ctx.fillText(text, centerX, centerY);

    // Reset shadow for underline
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw underline if enabled
    if (underline) {
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const underlineY = centerY + fontSize * 0.1;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, fontSize * 0.05);
      ctx.beginPath();
      ctx.moveTo(centerX - textWidth / 2, underlineY);
      ctx.lineTo(centerX + textWidth / 2, underlineY);
      ctx.stroke();
    }

    ctx.restore();
  }, [text, fontSize, bold, italic, underline, color, previewPan]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), fontSize, bold, italic, underline, color);
    } else {
      onCancel();
    }
  };

  const handleFontSizeChange = (value: string) => {
    setFontSizeInput(value);
    
    // Parse and validate the input
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 6 && numValue <= 500) {
      setFontSize(numValue);
    }
  };

  const handleFontSizeBlur = () => {
    // On blur, ensure the input shows a valid value
    const numValue = parseInt(fontSizeInput, 10);
    if (isNaN(numValue) || numValue < 6 || numValue > 500) {
      setFontSizeInput(fontSize.toString());
    } else {
      const clampedValue = Math.max(6, Math.min(500, numValue));
      setFontSize(clampedValue);
      setFontSizeInput(clampedValue.toString());
    }
  };

  const incrementFontSize = () => {
    const newSize = Math.min(500, fontSize + 1);
    setFontSize(newSize);
    setFontSizeInput(newSize.toString());
  };

  const decrementFontSize = () => {
    const newSize = Math.max(6, fontSize - 1);
    setFontSize(newSize);
    setFontSizeInput(newSize.toString());
  };

  const selectFontSize = (size: number) => {
    setFontSize(size);
    setFontSizeInput(size.toString());
    setShowSizeDropdown(false);
  };

  // Preview canvas drag handlers
  const handlePreviewMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingPreview(true);
    setDragStart({ x: e.clientX - previewPan.x, y: e.clientY - previewPan.y });
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingPreview) {
      setPreviewPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handlePreviewMouseUp = () => {
    setIsDraggingPreview(false);
  };

  const handlePreviewMouseLeave = () => {
    setIsDraggingPreview(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 min-w-96 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: Math.max(384, Math.min(800, fontSize * 8 + 200)) // Dynamic width based on font size
        }}
      >
        {/* Formatting toolbar */}
        <div className="flex items-center gap-3 mb-3">
          {/* Font size selector with custom dropdown and increment/decrement */}
          <div className="flex items-center gap-2 relative" ref={sizeDropdownRef}>
            <label className="text-sm font-medium text-gray-700">Size:</label>
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <input
                type="text"
                value={fontSizeInput}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                onBlur={handleFontSizeBlur}
                onFocus={() => setShowSizeDropdown(true)}
                className="w-12 px-2 py-1 text-center focus:outline-none"
                style={{ fontSize: '16px' }}
                title="Font size (6-500)"
              />
              <div className="flex flex-col border-l border-gray-300">
                <button
                  type="button"
                  onClick={incrementFontSize}
                  className="px-1 hover:bg-gray-100 transition-colors"
                  title="Increase size"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={decrementFontSize}
                  className="px-1 hover:bg-gray-100 transition-colors border-t border-gray-300"
                  title="Decrease size"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
            
            {/* Dropdown menu */}
            {showSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {[6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96, 120, 144, 200, 300, 500].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => selectFontSize(size)}
                    className={`w-full text-left px-3 py-1 hover:bg-blue-50 transition-colors ${
                      fontSize === size ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    style={{ fontSize: '16px' }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Format buttons */}
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setBold(!bold)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${bold ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Bold"
            >
              <Bold size={18} />
            </button>
            <button
              type="button"
              onClick={() => setItalic(!italic)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${italic ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Italic"
            >
              <Italic size={18} />
            </button>
            <button
              type="button"
              onClick={() => setUnderline(!underline)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${underline ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Underline"
            >
              <Underline size={18} />
            </button>
            
            {/* Color picker */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-100 transition-colors border border-gray-300"
                title="Text Color"
                style={{ backgroundColor: color }}
              >
                <Droplet size={18} fill={color} stroke="white" strokeWidth={1} />
              </button>
              
              {showColorPicker && (
                <ColorPicker
                  selectedColor={color}
                  onColorChange={setColor}
                  onClose={() => setShowColorPicker(false)}
                  position="left"
                />
              )}
            </div>
          </div>
        </div>

        {/* Text input area - fixed 16px font */}
        <div className="mb-4">
          <input
            ref={textareaRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '16px',
            }}
            placeholder="Type your text..."
          />
        </div>

        {/* Preview canvas - 150px tall, draggable */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Preview (100% zoom - drag to pan)</div>
          <canvas
            ref={previewCanvasRef}
            width={600}
            height={150}
            className="w-full border border-gray-300 rounded-md"
            style={{
              cursor: isDraggingPreview ? 'grabbing' : 'grab',
              height: '150px',
            }}
            onMouseDown={handlePreviewMouseDown}
            onMouseMove={handlePreviewMouseMove}
            onMouseUp={handlePreviewMouseUp}
            onMouseLeave={handlePreviewMouseLeave}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            title="Cancel (Esc)"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            className={`px-4 py-2 rounded-md transition-colors ${
              text.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Save (Enter)"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

