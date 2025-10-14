import { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Rectangle as RectangleType } from '../../types';

interface RectangleProps {
  rectangle: RectangleType;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function Rectangle({ rectangle, isSelected, onClick, onDragEnd }: RectangleProps) {
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Attach transformer to selected rectangle
  useEffect(() => {
    if (isSelected && rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent event from bubbling to stage
    onClick(rectangle.id);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(rectangle.id, e.target.x(), e.target.y());
  };

  return (
    <>
      <Rect
        ref={rectRef}
        id={rectangle.id}
        x={rectangle.x}
        y={rectangle.y}
        width={rectangle.width}
        height={rectangle.height}
        fill={rectangle.fill}
        stroke={isSelected ? '#000000' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable={isSelected}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        shadowColor={isSelected ? 'black' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
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
}

