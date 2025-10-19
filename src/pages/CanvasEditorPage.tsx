import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Canvas } from '../components/canvas/Canvas';
import { Toolbar } from '../components/toolbar/Toolbar';
import { OnlineUsers } from '../components/presence/OnlineUsers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AIAssistantButton } from '../components/ai/AIAssistantButton';
import { AIChatPanel } from '../components/ai/AIChatPanel';
import { Logo } from '../components/common/Logo';
import { getCanvas, updateLastOpened, renameCanvas } from '../utils/canvases';
import { useToast } from '../hooks/useToast';
import { useCanvasList } from '../hooks/useCanvasList';
import { useCanvas } from '../hooks/useCanvas';
import { processAICommand } from '../services/ai';
import { executeToolCalls } from '../services/aiTools';

export function CanvasEditorPage() {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();
  const authContext = useContext(UserContext);
  const { showError, showSuccess } = useToast();
  const { refreshCanvases } = useCanvasList();
  const canvasContext = useCanvas();
  // Initialize color from localStorage or use default
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = localStorage.getItem('collab-canvas-selected-color');
    return savedColor || '#3B82F6'; // Default blue
  });
  // Initialize line thickness from localStorage or use default
  const [lineThickness, setLineThickness] = useState(() => {
    const savedThickness = localStorage.getItem('collab-canvas-line-thickness');
    return savedThickness ? parseInt(savedThickness, 10) : 2; // Default 2px
  });
  const [isLoading, setIsLoading] = useState(true);
  const [canvasName, setCanvasName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [showAiUndo, setShowAiUndo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameShapesFuncRef = useRef<((shapes: any[]) => void) | null>(null);
  const deleteWithEffectFuncRef = useRef<(() => void) | null>(null);
  const zoomControlsRef = useRef<{ zoomIn: () => void; zoomOut: () => void; zoomReset: () => void } | null>(null);
  const [waitingForShapeIds, setWaitingForShapeIds] = useState<string[]>([]);
  const [viewportTransform, setViewportTransform] = useState({ 
    x: 0, 
    y: 0, 
    scale: 1 
  });

  // Handle color change and save to localStorage
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    localStorage.setItem('collab-canvas-selected-color', color);
  };

  // Handle line thickness change and save to localStorage
  const handleLineThicknessChange = (thickness: number) => {
    setLineThickness(thickness);
    localStorage.setItem('collab-canvas-line-thickness', thickness.toString());
  };

  // Auto-dismiss AI success message after 10 seconds
  useEffect(() => {
    if (aiSuccessMessage) {
      const timer = setTimeout(() => {
        setAiSuccessMessage(null);
        setShowAiUndo(false); // Also hide undo button when message is dismissed
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [aiSuccessMessage]);

  // Listen for floating AI button event to open AI panel with selected shapes context
  useEffect(() => {
    const handleOpenAIAssistant = (e: any) => {
      const selectedShapeIds = e.detail?.selectedShapeIds || [];
      // Open the AI panel
      setShowAIPanel(true);
      // Add context about selected shapes to the command
      if (selectedShapeIds.length > 0) {
        setAiCommand('');
      }
    };

    window.addEventListener('openAIAssistant', handleOpenAIAssistant as EventListener);
    return () => window.removeEventListener('openAIAssistant', handleOpenAIAssistant as EventListener);
  }, []);

  // Calculate viewport center in world coordinates
  const getViewportCenter = () => {
    // Get viewport center in screen coordinates
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Convert to world coordinates using inverse transformation
    // Formula: worldCoord = (screenCoord - stagePosition) / scale
    // This accounts for pan (stagePosition) and zoom (scale)
    const scale = viewportTransform.scale || 1; // Prevent division by zero
    const worldCenterX = (screenCenterX - viewportTransform.x) / scale;
    const worldCenterY = (screenCenterY - viewportTransform.y) / scale;
    
    // Clamp to canvas bounds (5000x5000) - allow negative coordinates for proper viewport center
    const clampedX = Math.max(-1000, Math.min(6000, worldCenterX)); // Allow some negative space
    const clampedY = Math.max(-1000, Math.min(6000, worldCenterY)); // Allow some negative space
    
    
    return { x: clampedX, y: clampedY };
  };

  // Calculate viewport bounds (visible area of canvas)
  const getViewportBounds = () => {
    const scale = viewportTransform.scale || 1;
    const x = -viewportTransform.x / scale;
    const y = -viewportTransform.y / scale;
    const width = window.innerWidth / scale;
    const height = window.innerHeight / scale;
    
    return { x, y, width, height };
  };

  // Handle viewport changes (memoized to prevent infinite re-renders)
  const handleViewportChange = useCallback((x: number, y: number, scale: number) => {
    setViewportTransform({ x, y, scale });
  }, []);

  // Handle frame shapes ready callback (memoized to prevent infinite re-renders)
  const handleFrameShapesReady = useCallback((fn: (shapes: any[]) => void) => {
    frameShapesFuncRef.current = fn;
  }, []);

  // Handle delete with effect ready callback (memoized to prevent infinite re-renders)
  const handleDeleteWithEffectReady = useCallback((fn: () => void) => {
    deleteWithEffectFuncRef.current = fn;
  }, []);

  // Handle zoom control ready callback (memoized to prevent infinite re-renders)
  const handleZoomControlReady = useCallback((controls: { zoomIn: () => void; zoomOut: () => void; zoomReset: () => void }) => {
    zoomControlsRef.current = controls;
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    if (zoomControlsRef.current) {
      zoomControlsRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (zoomControlsRef.current) {
      zoomControlsRef.current.zoomOut();
    }
  };

  const handleZoomReset = () => {
    if (zoomControlsRef.current) {
      zoomControlsRef.current.zoomReset();
    }
  };

  // Handle frame selected shapes
  const handleFrameSelected = () => {
    if (!frameShapesFuncRef.current || !canvasContext || canvasContext.selectedIds.length === 0) {
      return;
    }

    // Get the selected shapes
    const selectedShapes = canvasContext.objects.filter(obj =>
      canvasContext.selectedIds.includes(obj.id)
    );

    // Frame them
    if (selectedShapes.length > 0) {
      frameShapesFuncRef.current(selectedShapes);
    }
  };

  // Watch for AI-created shapes to appear in objects array
  useEffect(() => {
    if (waitingForShapeIds.length === 0 || !canvasContext) return;

    // Check if all waiting IDs have appeared
    const existingIds = waitingForShapeIds.filter(id =>
      canvasContext.objects.some(obj => obj.id === id)
    );

    if (existingIds.length === waitingForShapeIds.length) {
      // Clear waiting state
      setWaitingForShapeIds([]);

      // Select and frame the shapes
      canvasContext.clearSelection();
      setTimeout(() => {
        canvasContext.selectMultiple(existingIds);
        
        // Frame the shapes
        setTimeout(() => {
          const affectedShapes = canvasContext.objects.filter(obj => 
            existingIds.includes(obj.id)
          );
          if (affectedShapes.length > 0) {
            window.dispatchEvent(new CustomEvent('frame-shapes', { 
              detail: { shapes: affectedShapes } 
            }));
          }
        }, 50);
      }, 10);
    }
  }, [canvasContext?.objects, waitingForShapeIds, canvasContext]);

  if (!authContext || !authContext.user) {
    return null;
  }

  const { user } = authContext;

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

  // AI handlers
  const handleAISubmit = async (command: string) => {
    if (!canvasId || !canvasContext) return;

    setAiLoading(true);
    setAiError(null);
    setAiSuccessMessage(null); // Clear previous messages

    try {
      // Get canvas state for AI context
      const canvasState = canvasContext.objects.map((obj) => {
        if (obj.type === 'rectangle') {
          return {
            id: obj.id,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            fill: obj.fill,
            rotation: obj.rotation,
          };
        } else if (obj.type === 'circle') {
          return {
            id: obj.id,
            type: obj.type,
            x: obj.centerX,
            y: obj.centerY,
            radius: obj.radius,
            fill: obj.fill,
          };
        } else if (obj.type === 'line') {
          // Convert line format to x1,y1,x2,y2 for AI
          const x1 = obj.x;
          const y1 = obj.y;
          const angleRad = (obj.rotation * Math.PI) / 180;
          const x2 = x1 + obj.width * Math.cos(angleRad);
          const y2 = y1 + obj.width * Math.sin(angleRad);
          return {
            id: obj.id,
            type: obj.type,
            x: x1,
            y: y1,
            x1,
            y1,
            x2,
            y2,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
          };
        } else {
          // text
          return {
            id: obj.id,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            text: obj.text,
            fontSize: obj.fontSize,
            fill: obj.fill,
          };
        }
      });

        // Call AI Cloud Function
        const response = await processAICommand({
          command,
          canvasId,
          canvasState,
          viewportCenter: getViewportCenter(), // Use actual viewport center
          selectedShapeIds: canvasContext.selectedIds,
          currentColor: selectedColor,
          currentStrokeWidth: lineThickness,
          viewportBounds: getViewportBounds(), // Pass viewport bounds
        });

      if (response.success && response.toolCalls && response.toolCalls.length > 0) {
        // Determine operation type for undo
        const hasCreate = response.toolCalls.some(tc => 
          tc.function.name.startsWith('create')
        );
        const hasDelete = response.toolCalls.some(tc => 
          tc.function.name === 'deleteShapes'
        );

        // Determine primary operation type (priority: delete > create > modify)
        let operationType: 'create' | 'delete' | 'modify' = 'modify';
        if (hasDelete) {
          operationType = 'delete';
        } else if (hasCreate) {
          operationType = 'create';
        }

        // For delete operations, capture snapshot BEFORE deletion
        if (hasDelete) {
          const deleteToolCall = response.toolCalls.find(
            tc => tc.function.name === 'deleteShapes'
          );
          
          if (deleteToolCall) {
            try {
              const deleteArgs = JSON.parse(deleteToolCall.function.arguments);
              const shapeIdsToDelete = deleteArgs.shapeIds as string[];

              if (shapeIdsToDelete && shapeIdsToDelete.length > 0) {
                // Capture undo snapshot BEFORE deletion (with shapes still existing)
                canvasContext.captureUndoSnapshot('delete', shapeIdsToDelete);

                // PREVIEW deletion: select shapes, frame them, wait, THEN delete WITH POOF
                // 1. Select the shapes that will be deleted
                canvasContext.selectMultiple(shapeIdsToDelete);

                // 2. Frame/center the canvas on them
                const shapesToFrame = canvasContext.objects.filter(obj =>
                  shapeIdsToDelete.includes(obj.id)
                );
                if (shapesToFrame.length > 0 && frameShapesFuncRef.current) {
                  frameShapesFuncRef.current(shapesToFrame);
                }

                // 3. Wait 1 second so canvas animation completes and user can see what's being deleted
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 4. Delete with poof effect (undo snapshot is automatically captured by deleteObject)
                if (deleteWithEffectFuncRef.current) {
                  deleteWithEffectFuncRef.current();
                } else {
                  // Fallback to regular delete if poof not available
                  canvasContext.deleteObject(shapeIdsToDelete);
                }

                // Show success message with undo button
                const count = shapeIdsToDelete.length;
                setAiSuccessMessage(`Done! ${count} shape${count !== 1 ? 's' : ''} deleted.`);
                setShowAiUndo(true); // Show undo button since shapes were deleted
                setAiCommand('');
                return; // Exit early since we handled delete
              }
            } catch (error) {
              console.error('Error previewing deletion:', error);
              // Continue with regular deletion if preview fails
            }
          }
        }

        // For create/modify operations, capture snapshot BEFORE execution (for modify) or AFTER (for create)
        let shapesBeforeOperation: typeof canvasContext.objects = [];
        if (operationType === 'modify') {
          // For modify, we need to capture the current state of shapes that will be modified
          // Get all affected shape IDs from tool calls
          const modifyToolCalls = response.toolCalls.filter(tc =>
            ['moveShapes', 'resizeShapes', 'rotateShapes', 'changeColor', 'modifyText', 'arrangeInGrid', 'alignShapes', 'distributeShapes'].includes(tc.function.name)
          );
          const affectedIdsBeforeModify: string[] = [];
          for (const tc of modifyToolCalls) {
            try {
              const args = JSON.parse(tc.function.arguments);
              if (args.shapeIds) {
                affectedIdsBeforeModify.push(...args.shapeIds);
              }
            } catch (error) {
              console.error('Error parsing tool call arguments:', error);
            }
          }
          if (affectedIdsBeforeModify.length > 0) {
            shapesBeforeOperation = canvasContext.objects.filter(obj =>
              affectedIdsBeforeModify.includes(obj.id)
            );
          }
        }

        // Disable auto-capture during AI operations
        canvasContext.setDisableUndoCapture(true);

        // Capture undo state BEFORE operation to detect if it changes
        const undoStateBeforeOperation = canvasContext.undoState;

        // Execute tool calls
        const affectedShapeIds = await executeToolCalls(
          response.toolCalls,
          canvasContext,
          user.uid
        );

        // Re-enable auto-capture
        canvasContext.setDisableUndoCapture(false);

        console.log('🎯 AI created/modified shape IDs:', affectedShapeIds);

        // Check if any shapes were actually affected
        // Note: For deletions, affectedShapeIds will be empty, but undoState will be created
        const undoStateAfterOperation = canvasContext.undoState;
        const undoStateChanged = undoStateAfterOperation !== undoStateBeforeOperation;
        
        if (affectedShapeIds.length === 0 && !undoStateChanged) {
          // No changes were made at all
          setAiSuccessMessage('Command processed, but no shapes were created or modified.');
          setShowAiUndo(false);
          return;
        }

        // Manually capture undo snapshot after AI operations complete
        if (operationType === 'create') {
          // For create, capture AFTER creation (shapes now exist)
          canvasContext.captureUndoSnapshot('create', affectedShapeIds);
        } else if (operationType === 'modify' && shapesBeforeOperation.length > 0) {
          // For modify, use the snapshot we captured BEFORE modification
          canvasContext.captureUndoSnapshot('modify', affectedShapeIds);
        }

        // For create/modify operations, wait for shapes to appear and then select them
        if (affectedShapeIds.length > 0) {
          setWaitingForShapeIds(affectedShapeIds);
        }

        // Show success toast with undo button
        if (affectedShapeIds.length > 0) {
          const count = affectedShapeIds.length;
          setAiSuccessMessage(`Done! ${count} shape${count !== 1 ? 's' : ''} created/modified.`);
        } else {
          // Likely a deletion or other operation that doesn't return affected IDs
          setAiSuccessMessage('Done!');
        }
        setAiError(null); // Clear error message when showing success
        setShowAiUndo(true); // Show undo button since shapes were modified (or deleted)
        setAiCommand('');
      } else if (response.success && (!response.toolCalls || response.toolCalls.length === 0)) {
        // AI responded but didn't generate any tool calls - this is informational, not an error
        setAiSuccessMessage("The prompt didn't result in any changes. Try being more specific or refer to the examples below for guidance.");
        setAiError(null); // Clear error message when showing info
        setShowAiUndo(false); // No undo button since no shapes were modified
      } else {
        // Other error
        setAiError(response.error || 'Failed to process command');
        setAiSuccessMessage(null); // Clear success message when showing error
      }
    } catch (error: any) {
      console.error('AI command error:', error);
      setAiError(error.message || 'Something went wrong. Please try again.');
      setAiSuccessMessage(null); // Clear success message when showing error
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIUndo = useCallback(() => {
    if (canvasContext) {
      canvasContext.undo();
      setAiSuccessMessage(null); // Clear success message after undo
      setShowAiUndo(false); // Hide undo button after undo
    }
  }, [canvasContext]);

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
        <div className="pl-0 pr-4 sm:pr-6 lg:pr-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 flex justify-center">
              <Logo size={45} className="flex-shrink-0" />
            </div>
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* AI Assistant Button */}
            <AIAssistantButton 
              onClick={() => {
                setShowAIPanel(true);
                setAiError(null); // Clear previous error
              }}
              disabled={false}
            />
            {/* Online Users - positioned in top-right */}
            <OnlineUsers />
          </div>
        </div>
      </header>

      {/* Toolbar - positioned in top-left */}
      <Toolbar 
        selectedColor={selectedColor} 
        onColorChange={handleColorChange}
        lineThickness={lineThickness}
        onLineThicknessChange={handleLineThicknessChange}
        showInfo={showInfo}
        onToggleInfo={() => setShowInfo(!showInfo)}
        onBackToCanvasList={handleBackToCanvasList}
        onFrameSelected={handleFrameSelected}
        onDeleteSelected={() => deleteWithEffectFuncRef.current?.()}
        currentZoom={viewportTransform.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* Canvas - full screen */}
      <Canvas 
        selectedColor={selectedColor} 
        lineThickness={lineThickness}
        showInfo={showInfo}
        onFrameShapesReady={handleFrameShapesReady}
        onViewportChange={handleViewportChange}
        onDeleteWithEffectReady={handleDeleteWithEffectReady}
        onZoomControlReady={handleZoomControlReady}
      />

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        onSubmit={handleAISubmit}
        isLoading={aiLoading}
        error={aiError}
        onOpenInfo={() => {}} // Removed as per edit hint
        initialCommand={aiCommand}
        successMessage={aiSuccessMessage}
        onUndo={showAiUndo && canvasContext.undoState ? handleAIUndo : undefined}
        selectedShapeCount={canvasContext.selectedIds.length}
        onClearSelection={() => canvasContext.clearSelection()}
      />

      {/* AI Info Modal */}
      {/* Removed as per edit hint */}
    </div>
  );
}
