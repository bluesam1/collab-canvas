import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

// Canvas configuration
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SPEED = 0.1;
const GRID_SIZE = 50;

export function Canvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Handle mouse down for panning
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only pan on middle mouse button or when space is held
    if (e.evt.button === 1 || e.evt.button === 0) {
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

  // Handle mouse move for panning
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning) return;

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
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
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
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Objects layer - rectangles will be added here in future PRs */}
        <Layer>
          {/* Future: Rectangles will be rendered here */}
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
          <div className="text-xs text-gray-600 mt-1">
            Drag to pan • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}

