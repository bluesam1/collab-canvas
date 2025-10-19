import { useState, useRef, useEffect } from 'react';
import { X, Send, HelpCircle, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { ALL_EXAMPLES } from '../../utils/aiExamples';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (command: string) => void;
  isLoading: boolean;
  error: string | null;
  onOpenInfo?: () => void;
  initialCommand?: string;
  successMessage?: string | null;
  onUndo?: () => void;
  selectedShapeCount?: number;
  onClearSelection?: () => void;
}

export const AIChatPanel = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  onOpenInfo,
  initialCommand = '',
  successMessage,
  onUndo,
  selectedShapeCount = 0,
  onClearSelection,
}: AIChatPanelProps) => {
  const [command, setCommand] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHoveringExamples, setIsHoveringExamples] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('AI is thinking...');
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef<boolean>(false);

  // Update command when initialCommand changes
  useEffect(() => {
    if (initialCommand) {
      setCommand(initialCommand);
    }
  }, [initialCommand]);

  // Auto-focus and select text when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure the panel is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
        // Select all text if there's any
        if (textareaRef.current && textareaRef.current.value) {
          textareaRef.current.select();
        }
      }, 100);
    }
  }, [isOpen]);

  // Focus and select text after AI processing completes
  useEffect(() => {
    // Only focus/select when loading transitions from true to false (processing just completed)
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    
    if (wasLoading && !isLoading && isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
    }
  }, [isLoading, isOpen]);

  // Progressive loading messages
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage('AI is thinking...');
      return;
    }

    // After 3 seconds: "We are still working on it..."
    const timer1 = setTimeout(() => {
      setLoadingMessage('We are still working on it...');
    }, 3000);

    // After 8 seconds total (3 + 5): "This is a tough one. AI is still thinking..."
    const timer2 = setTimeout(() => {
      setLoadingMessage('This is a tough one. AI is still thinking...');
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  // Rollodex-style example rotation (pause on hover)
  useEffect(() => {
    if (!isOpen || isHoveringExamples) return;

    const interval = setInterval(() => {
      setCurrentExampleIndex((prevIndex) => {
        // Move to next example, loop back to 0 after last one
        return (prevIndex + 1) % ALL_EXAMPLES.length;
      });
    }, 4000); // Change every 4 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, isHoveringExamples]);

  // Initialize position to bottom-right
  useEffect(() => {
    if (isOpen && position.x === 0 && position.y === 0) {
      setPosition({
        x: window.innerWidth - 420, // 400px width + 20px margin
        y: window.innerHeight - 520, // 500px height + 20px margin
      });
    }
  }, [isOpen, position]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle Escape key (removed click-outside auto-close so panel stays open until explicitly closed)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSubmit(command.trim());
      // Focus and select will happen automatically when isLoading changes back to false
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (command.trim() && !isLoading) {
        onSubmit(command.trim());
        // Focus and select will happen automatically when isLoading changes back to false
      }
    }
    // Allow Shift+Enter for new line (default textarea behavior)
  };

  const handleExampleClick = (example: string) => {
    setCommand(example);
    textareaRef.current?.focus();
  };

  const handlePreviousExample = () => {
    setCurrentExampleIndex((prevIndex) => {
      return prevIndex === 0 ? ALL_EXAMPLES.length - 1 : prevIndex - 1;
    });
  };

  const handleNextExample = () => {
    setCurrentExampleIndex((prevIndex) => {
      return (prevIndex + 1) % ALL_EXAMPLES.length;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl w-[400px] max-h-[500px] flex flex-col z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg cursor-move select-none"
      >
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="See examples"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* Selected shapes hint */}
        {selectedShapeCount > 0 && (
          <p className="text-xs text-gray-600 mb-3 pb-2 border-b border-gray-200">
            {selectedShapeCount} object{selectedShapeCount !== 1 ? 's' : ''} selected. AI uses this as a reference.{' '}
            {onClearSelection && (
              <span className="text-blue-600 hover:underline cursor-pointer" onClick={onClearSelection}>
                (Deselect)
              </span>
            )}
          </p>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Describe what you want to do..."
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift+Enter</kbd> for new line
            </p>
            <button
              type="submit"
              disabled={!command.trim() || isLoading}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title={isLoading ? "Processing..." : "Send (Enter)"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Example Prompts Rollodex */}
        <div className="mt-3 mb-1">
          <p className="text-xs text-gray-500 mb-2">Try an example:</p>
          <div
            className="relative min-h-[32px] flex items-center gap-2"
            onMouseEnter={() => setIsHoveringExamples(true)}
            onMouseLeave={() => setIsHoveringExamples(false)}
          >
            {/* Previous button */}
            <button
              onClick={handlePreviousExample}
              disabled={isLoading}
              className="flex-shrink-0 p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous example"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Example button */}
            <button
              key={currentExampleIndex}
              onClick={() => handleExampleClick(ALL_EXAMPLES[currentExampleIndex])}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 text-xs text-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn"
            >
              {ALL_EXAMPLES[currentExampleIndex]}
            </button>

            {/* Next button */}
            <button
              onClick={handleNextExample}
              disabled={isLoading}
              className="flex-shrink-0 p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next example"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-gray-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingMessage}</span>
          </div>
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Success Display with Undo */}
        {successMessage && !isLoading && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-800">{successMessage}</span>
              </div>
              {onUndo && (
                <button
                  onClick={onUndo}
                  className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-700 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

