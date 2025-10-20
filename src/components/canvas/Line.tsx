import { useRef, memo, useState } from 'react';
import { Line as KonvaLine, Circle } from 'react-konva';
import Konva from 'konva';
import type { Line as LineType, CanvasMode } from '../../types';

interface LineProps {
  line: LineType;
  isSelected: boolean;
  isDraggable?: boolean;
  onClick: (id: string, shiftKey?: boolean) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTransform?: (id: string, updates: Partial<LineType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
  isMultiSelect?: boolean;
}

export const Line = memo(function Line({ line, isSelected, isDraggable, onClick, onDragStart, onDragMove, onTransform, mode, showTransformer = true, isMultiSelect = false }: LineProps) {
  const lineRef = useRef<Konva.Line>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);

  // Get current zoom scale for endpoint visibility
  const stageScale = lineRef.current?.getStage()?.scaleX() || 1;
  const zoomCompensatedRadius = 6 / stageScale; // Always 6 visual pixels
  const zoomCompensatedStrokeWidth = 2 / stageScale; // Always 2 visual pixels
  const hitAreaRadius = 12 / stageScale; // Larger hit area (12 visual pixels)

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
      } else if (mode === 'select') {
        container.style.cursor = 'default';
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
        name={line.id}
        x={centerX}
        y={centerY}
        points={[0, 0, line.width, 0]}
        offsetX={line.width / 2}
        offsetY={0}
        stroke={line.stroke}
        strokeWidth={line.strokeWidth}
        hitStrokeWidth={Math.max(line.strokeWidth + 8, 12)}
        rotation={line.rotation || 0}
        opacity={isSelected ? 0.75 : 1}
        shadowColor={!isMultiSelect && (isSelected || isHovered) ? 'black' : undefined}
        shadowBlur={isMultiSelect ? 0 : isSelected ? 10 : isHovered ? 6 : 0}
        shadowOpacity={isMultiSelect ? 0 : isSelected ? 0.3 : isHovered ? 0.2 : 0}
        shadowOffsetX={isMultiSelect ? 0 : isHovered ? 2 : 0}
        shadowOffsetY={isMultiSelect ? 0 : isHovered ? 2 : 0}
        lineCap="round"
        lineJoin="round"
        draggable={(isDraggable !== undefined ? isDraggable : isSelected) && !isDraggingEndpoint}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStartEvent}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Custom endpoint handles */}
      {isSelected && showTransformer && (
        <>
          {/* Start point handle - invisible hit area */}
          <Circle
            x={startX}
            y={startY}
            radius={hitAreaRadius}
            fill="transparent"
            draggable={true}
            onMouseDown={(e) => {
              e.cancelBubble = true; // Prevent canvas from handling this
            }}
            onClick={(e) => {
              e.cancelBubble = true; // Prevent canvas click handlers
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
              setIsDraggingEndpoint(true);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
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
            onDragEnd={(e) => {
              e.cancelBubble = true;
              handleEndpointDragEnd();
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'move';
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && !isDraggingEndpoint) {
                container.style.cursor = mode === 'pan' ? 'grab' : mode === 'select' ? 'default' : 'crosshair';
              }
            }}
          />
          
          {/* Start point handle - visible circle */}
          <Circle
            x={startX}
            y={startY}
            radius={zoomCompensatedRadius}
            fill="#ffffff"
            stroke="#3B82F6"
            strokeWidth={zoomCompensatedStrokeWidth}
            listening={false}
            perfectDrawEnabled={false}
          />
          
          {/* End point handle - invisible hit area */}
          <Circle
            x={endX}
            y={endY}
            radius={hitAreaRadius}
            fill="transparent"
            draggable={true}
            onMouseDown={(e) => {
              e.cancelBubble = true; // Prevent canvas from handling this
            }}
            onClick={(e) => {
              e.cancelBubble = true; // Prevent canvas click handlers
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
              setIsDraggingEndpoint(true);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
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
            onDragEnd={(e) => {
              e.cancelBubble = true;
              handleEndpointDragEnd();
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'move';
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && !isDraggingEndpoint) {
                container.style.cursor = mode === 'pan' ? 'grab' : mode === 'select' ? 'default' : 'crosshair';
              }
            }}
          />
          
          {/* End point handle - visible circle */}
          <Circle
            x={endX}
            y={endY}
            radius={zoomCompensatedRadius}
            fill="#ffffff"
            stroke="#3B82F6"
            strokeWidth={zoomCompensatedStrokeWidth}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      )}
    </>
  );
});
