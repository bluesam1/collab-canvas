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
  onDragEnd: (id: string, centerX: number, centerY: number) => void;
  onDragMove?: (id: string, centerX: number, centerY: number) => void;
  onTransform?: (id: string, updates: Partial<CircleType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
  showSelectionIndicators?: boolean;
  isMultiSelect?: boolean;
}

export const Circle = memo(function Circle({ circle, isSelected, isDraggable, onClick, onDblClick, onDragStart, onDragEnd, onDragMove, onTransform, mode, showTransformer = true, showSelectionIndicators = true, isMultiSelect = false }: CircleProps) {
  const circleRef = useRef<Konva.Circle>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected circle
  useEffect(() => {
    const transformer = transformerRef.current;
    const circleNode = circleRef.current;
    
    if (isSelected && showTransformer && circleNode && transformer) {
      transformer.nodes([circleNode]);
      transformer.getLayer()?.batchDraw();
    } else if (transformer) {
      // Clean up transformer when deselected or when showTransformer is false
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [isSelected, showTransformer]);

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
        name={circle.id}
        x={circle.centerX}
        y={circle.centerY}
        radius={circle.radius}
        fill={circle.fill}
        rotation={circle.rotation || 0}
        opacity={isSelected ? 0.75 : 1}
        shadowColor={!isMultiSelect && (isSelected || isHovered) ? 'black' : undefined}
        shadowBlur={isMultiSelect ? 0 : isSelected ? 10 : isHovered ? 6 : 0}
        shadowOpacity={isMultiSelect ? 0 : isSelected ? 0.3 : isHovered ? 0.2 : 0}
        shadowOffsetX={isMultiSelect ? 0 : isHovered ? 2 : 0}
        shadowOffsetY={isMultiSelect ? 0 : isHovered ? 2 : 0}
        stroke={isSelected && showSelectionIndicators ? '#3B82F6' : undefined}
        strokeWidth={isSelected && showSelectionIndicators ? 2 : 0}
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
        perfectDrawEnabled={false}
        drawHitFromCache={true}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          visible={showTransformer}
          borderEnabled={showTransformer}
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
