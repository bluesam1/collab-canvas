import { useState, useEffect } from 'react';

interface RenameCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<boolean>;
  currentName: string;
}

export function RenameCanvasModal({ isOpen, onClose, onRename, currentName }: RenameCanvasModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setIsLoading(false);
    }
  }, [isOpen, currentName]);

  // Auto-focus input and select all text when modal opens
  useEffect(() => {
    if (isOpen) {
      const input = document.querySelector('input[placeholder="Canvas name"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    
    if (!trimmedName || trimmedName === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const success = await onRename(trimmedName);
      if (success) {
        onClose();
      }
      // If not successful, the parent component will handle error display
    } catch (error) {
      console.error('Failed to rename canvas:', error);
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isDisabled = isLoading || !newName.trim() || newName.trim() === currentName;

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rename Canvas</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="canvas-name" className="block text-sm font-medium text-gray-700 mb-2">
              Canvas Name
            </label>
            <input
              id="canvas-name"
              type="text"
              placeholder="Canvas name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
