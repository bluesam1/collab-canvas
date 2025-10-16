import { useRef, useState, useEffect, useContext } from 'react';
import { Stage, Layer, Line as KonvaLine, Rect, Circle as KonvaCircle } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Line } from './Line';
import { Text } from './Text';
import { TextEditModal } from './TextEditModal';
import { isRectangle, isCircle, isLine, isText } from '../../types';
import { Cursor } from './Cursor';
import { useCanvas } from '../../hooks/useCanvas';
import { usePresence } from '../../hooks/usePresence';
import { UserContext } from '../../contexts/UserContext';

// Canvas configuration
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SPEED = 0.1;
const GRID_SIZE = 50;

// Rectangle constraints
const MIN_RECT_SIZE = 10;
const MAX_RECT_SIZE = 2000;

interface CanvasProps {
  selectedColor: string;
  showInfo: boolean;
}

export function Canvas({ selectedColor, showInfo }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Shape creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newShapeStart, setNewShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapeEnd, setNewShapeEnd] = useState<{ x: number; y: number } | null>(null);

  // Text modal state
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const [textModalPosition, setTextModalPosition] = useState({ x: 0, y: 0 });
  const [textModalFontSize, setTextModalFontSize] = useState(16);
  const [textModalBold, setTextModalBold] = useState(false);
  const [textModalItalic, setTextModalItalic] = useState(false);
  const [textModalUnderline, setTextModalUnderline] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textModalKey, setTextModalKey] = useState(0);


  // Canvas context and user context
  const { objects, selectedIds, isLoading, mode, setMode, createObject, updateObject, selectObject, deleteObject } = useCanvas();
  const { cursors, updateCursor } = usePresence();
  const authContext = useContext(UserContext);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cursor logic is handled by the Stage component


  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        selectObject(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        // Delete the selected rectangle
        e.preventDefault(); // Prevent browser back navigation on Backspace
        deleteObject(selectedIds[0]);
      } else if (e.key.toLowerCase() === 'v') {
        // Switch to Pan mode
        setMode('pan');
      } else if (e.key.toLowerCase() === 'r') {
        // Switch to Rectangle mode
        setMode('rectangle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectObject, deleteObject, selectedIds, setMode]);

  // Handle mouse down for panning or rectangle creation
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space (stage background)
    const clickedOnEmpty = e.target === e.target.getStage();

    // Deselect when clicking on empty space (in any mode)
    if (clickedOnEmpty) {
      selectObject(null);
    }

    // Handle based on current mode
    if (e.evt.button === 0) {  // Left mouse button
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };

          if (mode === 'rectangle' || mode === 'circle' || mode === 'line') {
            // Shape creation modes: Start creating shape (works even over existing shapes)
            setNewShapeStart(worldPos);
            setIsCreating(true);
          } else if (mode === 'text') {
            // Text mode: Show text modal
            setTextModalPosition(worldPos);
            setTextModalValue('');
            setTextModalFontSize(16);
            setTextModalBold(false);
            setTextModalItalic(false);
            setTextModalUnderline(false);
            setEditingTextId(null);
            setTextModalKey(prev => prev + 1); // Force modal remount
            setIsTextModalOpen(true);
          } else if (mode === 'pan' && clickedOnEmpty) {
            // Pan mode: Start panning only on empty space
            setIsPanning(true);
            const stagePos = stage.position();
            setDragStart({
              x: e.evt.clientX - stagePos.x,
              y: e.evt.clientY - stagePos.y,
            });
          }
        }
      }
    } else if (e.evt.button === 1) {
      // Middle button always pans regardless of mode
      setIsPanning(true);
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.position();
        setDragStart({
          x: e.evt.clientX - pos.x,
          y: e.evt.clientY - pos.y,
        });
      }
    }
  };

  // Handle mouse move for panning or rectangle creation
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    
    // Broadcast cursor position (world coordinates)
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const worldPos = {
          x: (pos.x - stage.x()) / stage.scaleX(),
          y: (pos.y - stage.y()) / stage.scaleY(),
        };
        // Update cursor position (throttled in PresenceContext)
        updateCursor(worldPos);
      }
    }
    
    if (isPanning) {
      const newPos = {
        x: e.evt.clientX - dragStart.x,
        y: e.evt.clientY - dragStart.y,
      };

      // Animate the position change
      if (stage) {
        stage.to({
          x: newPos.x,
          y: newPos.y,
          duration: 0.05,
          easing: Konva.Easings.EaseOut,
        });
        setStagePos(newPos);
      }
    } else if (isCreating && newShapeStart) {
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };
          setNewShapeEnd(worldPos);
        }
      }
    }
  };

  // Handle mouse up to stop panning or create rectangle
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isCreating && newShapeStart && newShapeEnd) {
      if (authContext?.user) {
        if (mode === 'rectangle') {
          // Calculate rectangle dimensions
          const width = Math.abs(newShapeEnd.x - newShapeStart.x);
          const height = Math.abs(newShapeEnd.y - newShapeStart.y);

          // Only create if dragged enough (minimum size)
          if (width >= MIN_RECT_SIZE && height >= MIN_RECT_SIZE) {
            // Enforce maximum size
            const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
            const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

            const x = Math.min(newShapeStart.x, newShapeEnd.x);
            const y = Math.min(newShapeStart.y, newShapeEnd.y);

            createObject({
              type: 'rectangle',
              x,
              y,
              width: constrainedWidth,
              height: constrainedHeight,
              fill: selectedColor,
              createdBy: authContext.user.uid,
            });
          }
        } else if (mode === 'circle') {
          // Calculate circle center and radius
          const centerX = (newShapeStart.x + newShapeEnd.x) / 2;
          const centerY = (newShapeStart.y + newShapeEnd.y) / 2;
          const radius = Math.sqrt(
            Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
            Math.pow(newShapeEnd.y - newShapeStart.y, 2)
          ) / 2;

          // Only create if dragged enough (minimum radius)
          if (radius >= MIN_RECT_SIZE / 2) {
            const constrainedRadius = Math.min(radius, MAX_RECT_SIZE / 2);

            createObject({
              type: 'circle',
              centerX,
              centerY,
              radius: constrainedRadius,
              fill: selectedColor,
              createdBy: authContext.user.uid,
            });
          }
        } else if (mode === 'line') {
          // Calculate line length
          const length = Math.sqrt(
            Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
            Math.pow(newShapeEnd.y - newShapeStart.y, 2)
          );

          // Only create if dragged enough (minimum length)
          if (length >= 10) {
            const maxLength = 5000;
            const constrainedLength = Math.min(length, maxLength);
            
            // Calculate constrained end point
            const angle = Math.atan2(newShapeEnd.y - newShapeStart.y, newShapeEnd.x - newShapeStart.x);
            const constrainedEndX = newShapeStart.x + Math.cos(angle) * constrainedLength;
            const constrainedEndY = newShapeStart.y + Math.sin(angle) * constrainedLength;

            createObject({
              type: 'line',
              x1: newShapeStart.x,
              y1: newShapeStart.y,
              x2: constrainedEndX,
              y2: constrainedEndY,
              stroke: selectedColor,
              strokeWidth: 4,
              createdBy: authContext.user.uid,
            });
          }
        }
      }

      // Reset creation state
      setIsCreating(false);
      setNewShapeStart(null);
      setNewShapeEnd(null);
    } else {
      // If no drag occurred, just reset
      setIsCreating(false);
      setNewShapeStart(null);
      setNewShapeEnd(null);
    }
  };

  // Handle wheel event for zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and new scale
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, oldScale + direction * ZOOM_SPEED)
    );

    if (newScale === oldScale) return;

    // Calculate new position to zoom towards cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // Animate the zoom and pan
    stage.to({
      x: newPos.x,
      y: newPos.y,
      scaleX: newScale,
      scaleY: newScale,
      duration: 0.1,
      easing: Konva.Easings.EaseOut,
    });

    setStageScale(newScale);
    setStagePos(newPos);
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const padding = 1000; // Extra padding for pan/zoom

    // Vertical lines
    for (let i = -padding; i <= CANVAS_WIDTH + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, -padding, i, CANVAS_HEIGHT + padding]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let i = -padding; i <= CANVAS_HEIGHT + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[-padding, i, CANVAS_WIDTH + padding, i]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    return lines;
  };

  // Handle rectangle selection
  const handleRectangleClick = (id: string) => {
    selectObject(id);
  };

  // Handle rectangle drag move
  const handleRectangleDragMove = (x: number, y: number) => {
    updateCursor({ x, y });
  };

  // Handle rectangle drag end
  const handleRectangleDragEnd = (id: string, x: number, y: number) => {
    updateObject(id, { x, y });
  };

  // Handle line drag end
  const handleLineDragEnd = (id: string, x1: number, y1: number, x2: number, y2: number) => {
    updateObject(id, { x1, y1, x2, y2 });
  };

  // Handle text drag end
  const handleTextDragEnd = (id: string, x: number, y: number) => {
    updateObject(id, { x, y });
  };

  // Handle text click - select first, then open modal for editing
  const handleTextClick = (id: string) => {
    const textObject = objects.find(obj => obj.id === id && isText(obj));
    if (textObject && isText(textObject)) {
      if (selectedIds.includes(id)) {
        // If already selected, open edit modal
        setEditingTextId(id);
        setTextModalValue(textObject.text);
        setTextModalFontSize(textObject.fontSize || 16);
        setTextModalBold(textObject.bold || false);
        setTextModalItalic(textObject.italic || false);
        setTextModalUnderline(textObject.underline || false);
        setIsTextModalOpen(true);
      } else {
        // If not selected, just select it
        selectObject(id);
      }
    }
  };

  // Handle text change (for double-click inline editing - deprecated but keeping for compatibility)
  const handleTextChange = (id: string, newText: string) => {
    updateObject(id, { text: newText });
  };

  // Handle text modal save
  const handleTextModalSave = (text: string, fontSize: number, bold: boolean, italic: boolean, underline: boolean) => {
    if (editingTextId) {
      // Editing existing text
      updateObject(editingTextId, { text, fontSize, bold, italic, underline });
    } else if (authContext?.user) {
      // Creating new text
      createObject({
        type: 'text',
        x: textModalPosition.x,
        y: textModalPosition.y,
        text,
        fontSize,
        fill: selectedColor,
        bold,
        italic,
        underline,
        createdBy: authContext.user.uid,
      });
    }
    setIsTextModalOpen(false);
    setEditingTextId(null);
    // Reset modal state
    setTextModalValue('');
    setTextModalFontSize(16);
    setTextModalBold(false);
    setTextModalItalic(false);
    setTextModalUnderline(false);
  };

  const handleTextModalCancel = () => {
    setIsTextModalOpen(false);
    setEditingTextId(null);
    // Reset modal state
    setTextModalValue('');
    setTextModalFontSize(16);
    setTextModalBold(false);
    setTextModalItalic(false);
    setTextModalUnderline(false);
  };


  // Calculate preview shape dimensions
  const getPreviewShape = () => {
    if (!isCreating || !newShapeStart || !newShapeEnd) return null;

    if (mode === 'rectangle') {
      const width = Math.abs(newShapeEnd.x - newShapeStart.x);
      const height = Math.abs(newShapeEnd.y - newShapeStart.y);

      // Only show preview if dragged enough
      if (width < MIN_RECT_SIZE || height < MIN_RECT_SIZE) return null;

      // Constrain to maximum size
      const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
      const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

      const x = Math.min(newShapeStart.x, newShapeEnd.x);
      const y = Math.min(newShapeStart.y, newShapeEnd.y);

      return { type: 'rectangle', x, y, width: constrainedWidth, height: constrainedHeight };
    } else if (mode === 'circle') {
      const centerX = (newShapeStart.x + newShapeEnd.x) / 2;
      const centerY = (newShapeStart.y + newShapeEnd.y) / 2;
      const radius = Math.sqrt(
        Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
        Math.pow(newShapeEnd.y - newShapeStart.y, 2)
      ) / 2;

      if (radius < MIN_RECT_SIZE / 2) return null;

      const constrainedRadius = Math.min(radius, MAX_RECT_SIZE / 2);

      return { type: 'circle', centerX, centerY, radius: constrainedRadius };
    } else if (mode === 'line') {
      const length = Math.sqrt(
        Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
        Math.pow(newShapeEnd.y - newShapeStart.y, 2)
      );

      if (length < 10) return null;

      const maxLength = 5000;
      const constrainedLength = Math.min(length, maxLength);
      
      const angle = Math.atan2(newShapeEnd.y - newShapeStart.y, newShapeEnd.x - newShapeStart.x);
      const constrainedEndX = newShapeStart.x + Math.cos(angle) * constrainedLength;
      const constrainedEndY = newShapeStart.y + Math.sin(angle) * constrainedLength;

      return { 
        type: 'line', 
        x1: newShapeStart.x, 
        y1: newShapeStart.y, 
        x2: constrainedEndX, 
        y2: constrainedEndY 
      };
    }

    return null;
  };

  const previewShape = getPreviewShape();

  // Show loading indicator while fetching initial data
  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-600 font-medium">Loading canvas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isPanning 
            ? 'grabbing' 
            : isCreating 
            ? 'crosshair' 
            : mode === 'pan'
            ? 'grab'
            : 'crosshair'
        }}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Objects layer */}
        <Layer>
          {/* Render existing shapes */}
          {objects.map((shape) => {
            if (isRectangle(shape)) {
              return (
                <Rectangle
                  key={shape.id}
                  rectangle={shape}
                  isSelected={selectedIds.includes(shape.id)}
                  onClick={handleRectangleClick}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleRectangleDragEnd}
                  mode={mode}
                />
              );
            } else if (isCircle(shape)) {
              return (
                <Circle
                  key={shape.id}
                  circle={shape}
                  isSelected={selectedIds.includes(shape.id)}
                  onClick={handleRectangleClick}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleRectangleDragEnd}
                  mode={mode}
                />
              );
            } else if (isLine(shape)) {
              return (
                <Line
                  key={shape.id}
                  line={shape}
                  isSelected={selectedIds.includes(shape.id)}
                  onClick={(id) => handleRectangleClick(id)}
                  onDragMove={(x, y) => handleRectangleDragMove(x, y)}
                  onDragEnd={(id, x1, y1, x2, y2) => handleLineDragEnd(id, x1, y1, x2, y2)}
                  mode={mode}
                />
              );
            } else if (isText(shape)) {
              return (
                <Text
                  key={shape.id}
                  text={shape}
                  isSelected={selectedIds.includes(shape.id)}
                  onClick={(id) => handleTextClick(id)}
                  onDragMove={(x, y) => handleRectangleDragMove(x, y)}
                  onDragEnd={(id, x, y) => handleTextDragEnd(id, x, y)}
                  onTextChange={handleTextChange}
                  mode={mode}
                />
              );
            }
            return null;
          })}

          {/* Preview shape during creation */}
          {previewShape && (
            <>
              {previewShape.type === 'rectangle' && 'x' in previewShape && (
                <Rect
                  x={(previewShape as any).x}
                  y={(previewShape as any).y}
                  width={(previewShape as any).width}
                  height={(previewShape as any).height}
                  fill={selectedColor}
                  opacity={0.5}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[10, 5]}
                  listening={false}
                />
              )}
              {previewShape.type === 'circle' && 'centerX' in previewShape && (
                <KonvaCircle
                  x={(previewShape as any).centerX}
                  y={(previewShape as any).centerY}
                  radius={(previewShape as any).radius}
                  fill={selectedColor}
                  opacity={0.5}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[10, 5]}
                  listening={false}
                />
              )}
              {previewShape.type === 'line' && 'x1' in previewShape && (
                <KonvaLine
                  points={[
                    (previewShape as any).x1, 
                    (previewShape as any).y1, 
                    (previewShape as any).x2, 
                    (previewShape as any).y2
                  ]}
                  stroke={selectedColor}
                  strokeWidth={2}
                  opacity={0.5}
                  dash={[10, 5]}
                  listening={false}
                />
              )}
            </>
          )}
        </Layer>

        {/* Cursors layer */}
        <Layer listening={false}>
          {/* Render remote cursors */}
          {Array.from(cursors.entries()).map(([userId, cursor]) => (
            <Cursor
              key={userId}
              x={cursor.x}
              y={cursor.y}
              email={cursor.email}
              color={cursor.color}
            />
          ))}
        </Layer>
      </Stage>

      {/* Canvas info overlay */}
      {showInfo && (
        <div className="absolute bottom-4 left-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm z-30">
          <div className="flex flex-col gap-1">
            <div>
              <span className="font-semibold">Zoom:</span>{' '}
              {(stageScale * 100).toFixed(0)}%
            </div>
            <div>
              <span className="font-semibold">Position:</span>{' '}
              ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})
            </div>
            <div>
              <span className="font-semibold">Objects:</span> {objects.length}
            </div>
            {selectedIds.length > 0 && (
              <div className="text-green-700">
                <span className="font-semibold">Selected:</span> {selectedIds.length}
              </div>
            )}
            <div>
              <span className="font-semibold">Mode:</span>{' '}
              {mode === 'pan' ? '👆 Navigation' : mode === 'rectangle' ? '⬛ Rectangle' : mode === 'circle' ? '⭕ Circle' : mode === 'line' ? '➖ Line' : mode === 'text' ? '📝 Text' : mode}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {mode === 'pan' 
                ? 'Click & drag to navigate'
                : mode === 'text'
                ? 'Click to add text'
                : 'Click & drag to create'
              }
            </div>
          </div>
        </div>
      )}

      {/* Text edit modal */}
      <TextEditModal
        key={textModalKey}
        isOpen={isTextModalOpen}
        initialText={textModalValue}
        initialFontSize={textModalFontSize}
        initialBold={textModalBold}
        initialItalic={textModalItalic}
        initialUnderline={textModalUnderline}
        onSave={handleTextModalSave}
        onCancel={handleTextModalCancel}
      />
    </div>
  );
}

