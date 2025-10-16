import { useRef, useEffect, memo, useState } from 'react';
import { Line as KonvaLine, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Line as LineType, CanvasMode } from '../../types';

interface LineProps {
  line: LineType;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragEnd: (id: string, x1: number, y1: number, x2: number, y2: number) => void;
  onDragMove?: (x: number, y: number) => void;
  mode: CanvasMode;
}

export const Line = memo(function Line({ 
  line, 
  isSelected, 
  onClick, 
  onDragMove, 
  onDragEnd, 
  mode 
}: LineProps) {
  const lineRef = useRef<Konva.Line>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected line
  useEffect(() => {
    if (isSelected && lineRef.current && transformerRef.current) {
      transformerRef.current.nodes([lineRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (mode !== 'line') {
      e.cancelBubble = true;
      onClick(line.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
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
    // For lines, we need to update both start and end points
    const newX1 = line.x1 + e.target.x();
    const newY1 = line.y1 + e.target.y();
    const newX2 = line.x2 + e.target.x();
    const newY2 = line.y2 + e.target.y();
    
    onDragEnd(line.id, newX1, newY1, newX2, newY2);
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
      <KonvaLine
        ref={lineRef}
        id={line.id}
        points={[line.x1, line.y1, line.x2, line.y2]}
        stroke={line.stroke}
        strokeWidth={line.strokeWidth}
        lineCap="round"
        lineJoin="round"
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
