import { useRef, useEffect, useState, memo } from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Rectangle as RectangleType, CanvasMode } from '../../types';

interface RectangleProps {
  rectangle: RectangleType;
  isSelected: boolean;
  onClick: (id: string, shiftKey?: boolean) => void;
  onDragStart?: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTransform?: (id: string, updates: Partial<RectangleType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
}

export const Rectangle = memo(function Rectangle({ rectangle, isSelected, onClick, onDragStart, onDragEnd, onDragMove, onTransform, mode, showTransformer = true }: RectangleProps) {
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected rectangle
  useEffect(() => {
    if (isSelected && rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle transform end (resize/rotate)
  const handleTransformEnd = () => {
    const node = rectRef.current;
    if (node && onTransform) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Calculate new dimensions
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);
      
      // Reset scale
      node.scaleX(1);
      node.scaleY(1);
      
      // Get rotation and normalize to 0-360
      let rotation = node.rotation() % 360;
      if (rotation < 0) rotation += 360;
      
      // Convert from center position back to top-left
      const centerX = node.x();
      const centerY = node.y();
      const topLeftX = centerX - newWidth / 2;
      const topLeftY = centerY - newHeight / 2;
      
      onTransform(rectangle.id, {
        x: topLeftX,
        y: topLeftY,
        width: newWidth,
        height: newHeight,
        rotation: rotation,
      });
    }
  };

  // Handle rotation with angle snapping
  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = rectRef.current;
    const transformer = transformerRef.current;
    
    if (node && transformer) {
      // Check if Shift key is pressed for smooth rotation
      const isShiftPressed = e.evt && 'shiftKey' in e.evt && e.evt.shiftKey;
      
      if (!isShiftPressed) {
        // Snap rotation to 15° increments
        const rotation = node.rotation();
        const snappedRotation = Math.round(rotation / 15) * 15;
        node.rotation(snappedRotation);
      }
    }
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Allow selection in any mode
    e.cancelBubble = true; // Prevent event from bubbling to stage
    onClick(rectangle.id, e.evt.shiftKey);
  };

  const handleDragStartEvent = () => {
    if (onDragStart) {
      onDragStart(rectangle.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      // Convert from center position to top-left during drag
      const centerX = e.target.x();
      const centerY = e.target.y();
      const topLeftX = centerX - rectangle.width / 2;
      const topLeftY = centerY - rectangle.height / 2;
      
      onDragMove(rectangle.id, topLeftX, topLeftY);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Convert from center position back to top-left
    const centerX = e.target.x();
    const centerY = e.target.y();
    const topLeftX = centerX - rectangle.width / 2;
    const topLeftY = centerY - rectangle.height / 2;
    onDragEnd(rectangle.id, topLeftX, topLeftY);
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
      } else {
        container.style.cursor = 'crosshair';
      }
    }
    setIsHovered(false);
  };

  return (
    <>
      <Rect
        ref={rectRef}
        id={rectangle.id}
        x={rectangle.x + rectangle.width / 2}
        y={rectangle.y + rectangle.height / 2}
        width={rectangle.width}
        height={rectangle.height}
        fill={rectangle.fill}
        rotation={rectangle.rotation || 0}
        offsetX={rectangle.width / 2}
        offsetY={rectangle.height / 2}
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable={isSelected}
        onClick={handleClick}
        onTap={handleClick}
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
          enabledAnchors={showTransformer ? ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'] : []}
          rotateEnabled={showTransformer}
          rotateAnchorOffset={20}
          keepRatio={false}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
});

