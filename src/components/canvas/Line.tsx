import { useRef, useEffect, memo, useState } from 'react';
import { Line as KonvaLine, Circle } from 'react-konva';
import Konva from 'konva';
import type { Line as LineType, CanvasMode } from '../../types';

interface LineProps {
  line: LineType;
  isSelected: boolean;
  onClick: (id: string, shiftKey?: boolean) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTransform?: (id: string, updates: Partial<LineType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
}

export const Line = memo(function Line({ 
  line, 
  isSelected, 
  onClick, 
  onDragStart,
  onDragMove,
  onTransform, 
  mode,
  showTransformer = true
}: LineProps) {
  const lineRef = useRef<Konva.Line>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);

  // Calculate start and end points
  const rotationRad = ((line.rotation || 0) * Math.PI) / 180;
  const startX = line.x;
  const startY = line.y;
  const endX = line.x + line.width * Math.cos(rotationRad);
  const endY = line.y + line.width * Math.sin(rotationRad);

  // Handle endpoint drag
  const handleEndpointDragMove = (isStart: boolean, newX: number, newY: number) => {
    if (onTransform) {
      // Calculate new line parameters
      let newStartX: number, newStartY: number, newEndX: number, newEndY: number;
      
      if (isStart) {
        // Dragging start point, end point stays fixed
        newStartX = newX;
        newStartY = newY;
        newEndX = endX;
        newEndY = endY;
      } else {
        // Dragging end point, start point stays fixed
        newStartX = startX;
        newStartY = startY;
        newEndX = newX;
        newEndY = newY;
      }
      
      // Calculate new width and rotation
      const deltaX = newEndX - newStartX;
      const deltaY = newEndY - newStartY;
      const newWidth = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const newRotation = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
      
      // Update the line
      onTransform(line.id, {
        x: newStartX,
        y: newStartY,
        width: newWidth,
        rotation: newRotation,
      });
    }
  };

  const handleEndpointDragEnd = () => {
    setIsDraggingEndpoint(false);
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Allow selection in any mode
    e.cancelBubble = true;
    onClick(line.id, e.evt.shiftKey);
  };

  const handleDragStartEvent = () => {
    if (onDragStart) {
      onDragStart(line.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      // Convert from center position back to start position
      const centerX = e.target.x();
      const centerY = e.target.y();
      const rotationRad = ((line.rotation || 0) * Math.PI) / 180;
      const newX = centerX - (line.width / 2) * Math.cos(rotationRad);
      const newY = centerY - (line.width / 2) * Math.sin(rotationRad);
      
      onDragMove(line.id, newX, newY);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const centerX = e.target.x();
    const centerY = e.target.y();
    
    // Convert from center position back to start position
    const rotationRad = ((line.rotation || 0) * Math.PI) / 180;
    const newX = centerX - (line.width / 2) * Math.cos(rotationRad);
    const newY = centerY - (line.width / 2) * Math.sin(rotationRad);
    
    if (onTransform) {
      onTransform(line.id, {
        x: newX,
        y: newY,
      });
    }
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

  // Calculate the center position of the line
  // The line is stored as start point (x, y) with width and rotation
  // We need to find the center point along the rotated line
  const centerX = line.x + (line.width / 2) * Math.cos(rotationRad);
  const centerY = line.y + (line.width / 2) * Math.sin(rotationRad);

  return (
    <>
      <KonvaLine
        ref={lineRef}
        id={line.id}
        x={centerX}
        y={centerY}
        points={[0, 0, line.width, 0]}
        offsetX={line.width / 2}
        offsetY={0}
        stroke={line.stroke}
        strokeWidth={line.strokeWidth}
        hitStrokeWidth={Math.max(line.strokeWidth + 8, 12)}
        rotation={line.rotation || 0}
        lineCap="round"
        lineJoin="round"
        draggable={isSelected && !isDraggingEndpoint}
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
      
      {/* Custom endpoint handles */}
      {isSelected && showTransformer && (
        <>
          {/* Start point handle */}
          <Circle
            x={startX}
            y={startY}
            radius={6}
            fill="#ffffff"
            stroke="#3B82F6"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => setIsDraggingEndpoint(true)}
            onDragMove={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  const worldPos = {
                    x: (pointerPos.x - stage.x()) / stage.scaleX(),
                    y: (pointerPos.y - stage.y()) / stage.scaleY(),
                  };
                  handleEndpointDragMove(true, worldPos.x, worldPos.y);
                }
              }
            }}
            onDragEnd={handleEndpointDragEnd}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'move';
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && !isDraggingEndpoint) {
                container.style.cursor = mode === 'pan' ? 'grab' : 'crosshair';
              }
            }}
          />
          
          {/* End point handle */}
          <Circle
            x={endX}
            y={endY}
            radius={6}
            fill="#ffffff"
            stroke="#3B82F6"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => setIsDraggingEndpoint(true)}
            onDragMove={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  const worldPos = {
                    x: (pointerPos.x - stage.x()) / stage.scaleX(),
                    y: (pointerPos.y - stage.y()) / stage.scaleY(),
                  };
                  handleEndpointDragMove(false, worldPos.x, worldPos.y);
                }
              }
            }}
            onDragEnd={handleEndpointDragEnd}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'move';
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && !isDraggingEndpoint) {
                container.style.cursor = mode === 'pan' ? 'grab' : 'crosshair';
              }
            }}
          />
        </>
      )}
    </>
  );
});
