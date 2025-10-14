import { useRef, useState, useEffect, useContext } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from './Rectangle';
import { useCanvas } from '../../hooks/useCanvas';
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
}

export function Canvas({ selectedColor }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Rectangle creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newRectStart, setNewRectStart] = useState<{ x: number; y: number } | null>(null);
  const [newRectEnd, setNewRectEnd] = useState<{ x: number; y: number } | null>(null);

  // Canvas context and user context
  const { objects, selectedIds, createObject, updateObject, selectObject, deleteObject } = useCanvas();
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectObject(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        // Delete the selected rectangle
        e.preventDefault(); // Prevent browser back navigation on Backspace
        deleteObject(selectedIds[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectObject, deleteObject, selectedIds]);

  // Handle mouse down for panning or rectangle creation
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space (stage background)
    const clickedOnEmpty = e.target === e.target.getStage();

    if (clickedOnEmpty) {
      // Deselect on empty click
      selectObject(null);

      // Start creating rectangle if left button
      if (e.evt.button === 0) {
        const stage = stageRef.current;
        if (stage) {
          const pos = stage.getPointerPosition();
          if (pos) {
            // Convert screen coordinates to world coordinates
            const worldPos = {
              x: (pos.x - stage.x()) / stage.scaleX(),
              y: (pos.y - stage.y()) / stage.scaleY(),
            };
            setNewRectStart(worldPos);
            setIsCreating(true);
          }
        }
      }
    } else {
      // Start panning if middle button or when not creating
      if (e.evt.button === 1) {
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
    }
  };

  // Handle mouse move for panning or rectangle creation
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      const newPos = {
        x: e.evt.clientX - dragStart.x,
        y: e.evt.clientY - dragStart.y,
      };

      // Animate the position change
      const stage = stageRef.current;
      if (stage) {
        stage.to({
          x: newPos.x,
          y: newPos.y,
          duration: 0.05,
          easing: Konva.Easings.EaseOut,
        });
        setStagePos(newPos);
      }
    } else if (isCreating && newRectStart) {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };
          setNewRectEnd(worldPos);
        }
      }
    }
  };

  // Handle mouse up to stop panning or create rectangle
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isCreating && newRectStart && newRectEnd) {
      // Calculate rectangle dimensions
      const width = Math.abs(newRectEnd.x - newRectStart.x);
      const height = Math.abs(newRectEnd.y - newRectStart.y);

      // Only create if dragged enough (minimum size)
      if (width >= MIN_RECT_SIZE && height >= MIN_RECT_SIZE) {
        // Enforce maximum size
        const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
        const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

        const x = Math.min(newRectStart.x, newRectEnd.x);
        const y = Math.min(newRectStart.y, newRectEnd.y);

        // Create the rectangle
        if (authContext?.user) {
          createObject({
            x,
            y,
            width: constrainedWidth,
            height: constrainedHeight,
            fill: selectedColor,
            createdBy: authContext.user.uid,
          });
        }
      }

      // Reset creation state
      setIsCreating(false);
      setNewRectStart(null);
      setNewRectEnd(null);
    } else {
      // If no drag occurred, just reset
      setIsCreating(false);
      setNewRectStart(null);
      setNewRectEnd(null);
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
        <Line
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
        <Line
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

  // Handle rectangle drag end
  const handleRectangleDragEnd = (id: string, x: number, y: number) => {
    updateObject(id, { x, y });
  };

  // Calculate preview rectangle dimensions
  const getPreviewRect = () => {
    if (!isCreating || !newRectStart || !newRectEnd) return null;

    const width = Math.abs(newRectEnd.x - newRectStart.x);
    const height = Math.abs(newRectEnd.y - newRectStart.y);

    // Only show preview if dragged enough
    if (width < MIN_RECT_SIZE || height < MIN_RECT_SIZE) return null;

    // Constrain to maximum size
    const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
    const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

    const x = Math.min(newRectStart.x, newRectEnd.x);
    const y = Math.min(newRectStart.y, newRectEnd.y);

    return { x, y, width: constrainedWidth, height: constrainedHeight };
  };

  const previewRect = getPreviewRect();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
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
        style={{ cursor: isPanning ? 'grabbing' : isCreating ? 'crosshair' : 'grab' }}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Objects layer */}
        <Layer>
          {/* Render existing rectangles */}
          {objects.map((rect) => (
            <Rectangle
              key={rect.id}
              rectangle={rect}
              isSelected={selectedIds.includes(rect.id)}
              onClick={handleRectangleClick}
              onDragEnd={handleRectangleDragEnd}
            />
          ))}

          {/* Preview rectangle during creation */}
          {previewRect && (
            <Rect
              x={previewRect.x}
              y={previewRect.y}
              width={previewRect.width}
              height={previewRect.height}
              fill={selectedColor}
              opacity={0.5}
              stroke={selectedColor}
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Canvas info overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm">
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
          <div className="text-xs text-gray-600 mt-1">
            Click & drag to create • Click to select • Drag to move • Del to delete
          </div>
        </div>
      </div>
    </div>
  );
}

