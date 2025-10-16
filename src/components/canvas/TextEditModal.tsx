import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface TextEditModalProps {
  isOpen: boolean;
  initialText: string;
  initialFontSize?: number;
  initialBold?: boolean;
  initialItalic?: boolean;
  initialUnderline?: boolean;
  onSave: (text: string, fontSize: number, bold: boolean, italic: boolean, underline: boolean) => void;
  onCancel: () => void;
}

export function TextEditModal({ 
  isOpen, 
  initialText, 
  initialFontSize = 16,
  initialBold = false,
  initialItalic = false,
  initialUnderline = false,
  onSave, 
  onCancel 
}: TextEditModalProps) {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [bold, setBold] = useState(initialBold);
  const [italic, setItalic] = useState(initialItalic);
  const [underline, setUnderline] = useState(initialUnderline);
  const textareaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(initialText);
    setFontSize(initialFontSize);
    setBold(initialBold);
    setItalic(initialItalic);
    setUnderline(initialUnderline);
  }, [initialText, initialFontSize, initialBold, initialItalic, initialUnderline]);

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

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), fontSize, bold, italic, underline);
    } else {
      onCancel();
    }
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
          {/* Font size selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={12}>12</option>
              <option value={14}>14</option>
              <option value={16}>16</option>
              <option value={18}>18</option>
              <option value={20}>20</option>
              <option value={24}>24</option>
              <option value={28}>28</option>
              <option value={32}>32</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
              <option value={60}>60</option>
              <option value={72}>72</option>
            </select>
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
          </div>
        </div>

        {/* Text input area */}
        <div className="mb-4">
          <input
            ref={textareaRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-x-auto"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: `${fontSize}px`,
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
              padding: `${Math.max(8, fontSize * 0.3)}px ${Math.max(12, fontSize * 0.4)}px`,
              minHeight: `${Math.max(40, fontSize * 1.5)}px`,
              maxHeight: '200px',
              overflow: fontSize > 48 ? 'auto' : 'visible'
            }}
            placeholder="Type your text..."
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

