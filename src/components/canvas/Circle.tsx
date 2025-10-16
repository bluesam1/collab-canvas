import { useRef, useEffect, memo, useState } from 'react';
import { Circle as KonvaCircle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Circle as CircleType, CanvasMode } from '../../types';

interface CircleProps {
  circle: CircleType;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  mode: CanvasMode;
}

export const Circle = memo(function Circle({ circle, isSelected, onClick, onDragMove, onDragEnd, mode }: CircleProps) {
  const circleRef = useRef<Konva.Circle>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected circle
  useEffect(() => {
    if (isSelected && circleRef.current && transformerRef.current) {
      transformerRef.current.nodes([circleRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow selection in pan mode
    // In creation modes, let the event bubble to the stage so users can draw over existing shapes
    if (mode === 'pan') {
      e.cancelBubble = true; // Prevent event from bubbling to stage
      onClick(circle.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      // Get the stage to access pointer position
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          // Convert to world coordinates
          const worldPos = {
            x: (pointerPos.x - stage.x()) / stage.scaleX(),
            y: (pointerPos.y - stage.y()) / stage.scaleY(),
          };
          onDragMove(worldPos.x, worldPos.y);
        }
      }
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(circle.id, e.target.x(), e.target.y());
  };

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      // Only show pointer cursor if not in object creation mode
      if (mode === 'pan') {
        container.style.cursor = 'pointer';
      }
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
      <KonvaCircle
        ref={circleRef}
        id={circle.id}
        x={circle.centerX}
        y={circle.centerY}
        radius={circle.radius}
        fill={circle.fill}
        stroke={isSelected ? '#000000' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable={isSelected}
        onClick={handleClick}
        onTap={handleClick}
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
          borderEnabled={false}
          anchorSize={8}
          anchorStroke="#000000"
          anchorFill="#ffffff"
          anchorCornerRadius={2}
          enabledAnchors={[]}
          rotateEnabled={false}
        />
      )}
    </>
  );
});
