import { useRef, useEffect, memo, useState } from 'react';
import { Circle as KonvaCircle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Circle as CircleType, CanvasMode } from '../../types';

interface CircleProps {
  circle: CircleType;
  isSelected: boolean;
  isDraggable?: boolean;
  onClick: (id: string, shiftKey?: boolean) => void;
  onDblClick?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTransform?: (id: string, updates: Partial<CircleType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
}

export const Circle = memo(function Circle({ circle, isSelected, isDraggable, onClick, onDblClick, onDragStart, onDragMove, onDragEnd, onTransform, mode, showTransformer = true }: CircleProps) {
  const circleRef = useRef<Konva.Circle>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected circle
  useEffect(() => {
    if (isSelected && circleRef.current && transformerRef.current) {
      transformerRef.current.nodes([circleRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (!isSelected && transformerRef.current) {
      // Clean up transformer when deselected
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle transform end (resize/rotate) - circles maintain circular shape
  const handleTransformEnd = () => {
    const node = circleRef.current;
    if (node && onTransform) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // For circles, use the average scale to maintain circular shape
      const avgScale = (scaleX + scaleY) / 2;
      
      // Reset scale
      node.scaleX(1);
      node.scaleY(1);
      
      // Get rotation and normalize to 0-360
      let rotation = node.rotation() % 360;
      if (rotation < 0) rotation += 360;
      
      onTransform(circle.id, {
        centerX: node.x(),
        centerY: node.y(),
        radius: Math.max(5, node.radius() * avgScale), // Min 5px radius
        rotation: rotation,
      });
    }
  };

  // Handle transform (resize only - rotation is disabled for circles)
  const handleTransform = () => {
    // No special handling needed - keepRatio ensures uniform scaling
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Allow selection in any mode
    e.cancelBubble = true; // Prevent event from bubbling to stage
    onClick(circle.id, e.evt.shiftKey);
  };

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent event from bubbling to stage
    if (onDblClick) {
      onDblClick(circle.id);
    }
  };

  const handleDragStartEvent = () => {
    if (onDragStart) {
      onDragStart(circle.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      // For circles, x and y are already the center position
      const centerX = e.target.x();
      const centerY = e.target.y();
      
      onDragMove(circle.id, centerX, centerY);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(circle.id, e.target.x(), e.target.y());
  };

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = 'pointer';
    }
    setIsHovered(true);
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      // Reset to the mode-based cursor
      if (mode === 'pan') {
        container.style.cursor = 'grab';
      } else if (mode === 'select') {
        container.style.cursor = 'default';
      } else {
        container.style.cursor = 'crosshair';
      }
    }
    setIsHovered(false);
  };

  return (
    <>
      <KonvaCircle
        ref={circleRef}
        id={circle.id}
        x={circle.centerX}
        y={circle.centerY}
        radius={circle.radius}
        fill={circle.fill}
        rotation={circle.rotation || 0}
        opacity={isSelected ? 0.7 : 1}
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable={isDraggable !== undefined ? isDraggable : isSelected}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragStart={handleDragStartEvent}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        shadowColor={isSelected || isHovered ? 'black' : undefined}
        shadowBlur={isSelected ? 10 : isHovered ? 6 : 0}
        shadowOpacity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
        shadowOffsetX={isHovered ? 2 : 0}
        shadowOffsetY={isHovered ? 2 : 0}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          borderEnabled={true}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          anchorSize={8}
          anchorStroke="#3B82F6"
          anchorFill="#ffffff"
          anchorCornerRadius={2}
          enabledAnchors={showTransformer ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : []}
          rotateEnabled={false}
          keepRatio={true}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
});
