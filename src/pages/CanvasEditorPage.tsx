import { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Canvas } from '../components/canvas/Canvas';
import { Toolbar } from '../components/toolbar/Toolbar';
import { OnlineUsers } from '../components/presence/OnlineUsers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getCanvas, updateLastOpened, renameCanvas } from '../utils/canvases';
import { useToast } from '../hooks/useToast';
import { useCanvasList } from '../hooks/useCanvasList';

export function CanvasEditorPage() {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();
  const authContext = useContext(UserContext);
  const { showError, showSuccess } = useToast();
  const { refreshCanvases } = useCanvasList();
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue
  const [isLoading, setIsLoading] = useState(true);
  const [canvasName, setCanvasName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!authContext || !authContext.user) {
    return null;
  }

  const { user, logout } = authContext;

  // Fetch canvas data and verify it exists
  useEffect(() => {
    const loadCanvas = async () => {
      if (!canvasId) {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        const canvas = await getCanvas(canvasId);
        if (!canvas) {
          showError('Canvas not found. It may have been deleted.');
          // Refresh the canvas list before navigating back
          await refreshCanvases();
          navigate('/');
          return;
        }

        setCanvasName(canvas.name);
        setIsOwner(canvas.ownerId === user.uid);
        
        // Record that the current user opened this canvas
        await updateLastOpened(canvasId, user.uid);
      } catch (error) {
        console.error('Failed to load canvas:', error);
        showError('Failed to load canvas. Please try again.');
        // Refresh the canvas list before navigating back
        await refreshCanvases();
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvas();
  }, [canvasId, user.uid, navigate, showError, refreshCanvases]);

  const handleBackToCanvasList = () => {
    navigate('/');
  };

  const handleNameClick = () => {
    if (isOwner) {
      setEditedName(canvasName);
      setIsEditingName(true);
    }
  };

  const handleNameSave = async () => {
    if (!canvasId || !editedName.trim() || editedName === canvasName) {
      setIsEditingName(false);
      return;
    }

    try {
      const success = await renameCanvas(canvasId, editedName.trim(), user.uid);
      if (success) {
        setCanvasName(editedName.trim());
        setIsEditingName(false);
        showSuccess('Canvas renamed successfully!');
        await refreshCanvases();
      } else {
        showError('Failed to rename canvas. You may not have permission.');
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Failed to rename canvas:', error);
      showError('Failed to rename canvas. Please try again.');
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LoadingSpinner 
          fullScreen 
          size="lg" 
          message="Loading canvas..." 
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800 text-white shadow-lg z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCanvasList}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Canvas List"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleNameSave}
                    className="text-xl font-bold bg-gray-700 text-white px-2 py-1 rounded border-2 border-blue-400 focus:outline-none focus:border-blue-500"
                    maxLength={100}
                  />
                </div>
              ) : (
                <h1 
                  className={`text-xl font-bold text-white ${isOwner ? 'cursor-pointer hover:text-blue-300 transition-colors' : ''}`}
                  onClick={handleNameClick}
                  title={isOwner ? 'Click to rename canvas' : ''}
                >
                  {canvasName}
                  {isOwner && (
                    <svg className="w-4 h-4 inline-block ml-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                </h1>
              )}
              <p className="text-xs text-gray-300">
                Signed in as <strong>{user.email}</strong>
                {user.color && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }}></span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Online Users - positioned in top-right */}
            <OnlineUsers />
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar - positioned in top-left */}
      <Toolbar selectedColor={selectedColor} onColorChange={setSelectedColor} />

      {/* Canvas - full screen */}
      <Canvas selectedColor={selectedColor} />
    </div>
  );
}
