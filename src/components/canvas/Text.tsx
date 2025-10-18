import { useRef, useEffect, memo, useState } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Text as TextType, CanvasMode } from '../../types';

interface TextProps {
  text: TextType;
  isSelected: boolean;
  isDraggable?: boolean;
  onClick: (id: string, shiftKey?: boolean) => void;
  onDragStart?: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, newText: string) => void;
  onTransform?: (id: string, updates: Partial<TextType>) => void;
  mode: CanvasMode;
  showTransformer?: boolean;
}

export const Text = memo(function Text({ 
  text, 
  isSelected,
  isDraggable,
  onClick, 
  onDragStart,
  onDragMove, 
  onDragEnd, 
  onTextChange,
  onTransform,
  mode,
  showTransformer = true
}: TextProps) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text.text);
  const [isHovered, setIsHovered] = useState(false);
  const [, forceUpdate] = useState({});
  const lastValidCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Force re-render after text is mounted to get correct dimensions
  useEffect(() => {
    if (textRef.current) {
      forceUpdate({});
    }
  }, [text.text, text.fontSize]);

  // Attach transformer to selected text
  useEffect(() => {
    if (isSelected && textRef.current && transformerRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle transform start - capture initial center
  const handleTransformStart = () => {
    const node = textRef.current;
    if (node) {
      lastValidCenterRef.current = {
        x: node.x(),
        y: node.y(),
      };
    }
  };

  // Handle transform end (resize/rotate) - text scales font size
  const handleTransformEnd = () => {
    const node = textRef.current;
    if (node && onTransform) {
      const scale = node.scaleX(); // scaleX and scaleY are the same due to keepRatio=true
      
      // Calculate new font size
      const newFontSize = Math.max(6, Math.min(500, text.fontSize * scale));
      
      // Get current position (which is the center)
      const centerX = node.x();
      const centerY = node.y();
      
      // Get rotation and normalize to 0-360
      let rotation = node.rotation() % 360;
      if (rotation < 0) rotation += 360;
      
      // Get current scaled dimensions
      const scaledWidth = node.width() * scale;
      const scaledHeight = node.height() * scale;
      
      // Reset scale
      node.scaleX(1);
      node.scaleY(1);
      
      // Convert from center position back to top-left using the scaled dimensions
      // This keeps the visual center exactly where it was during scaling
      const topLeftX = centerX - scaledWidth / 2;
      const topLeftY = centerY - scaledHeight / 2;
      
      // Clear the stored center
      lastValidCenterRef.current = null;
      
      onTransform(text.id, {
        x: topLeftX,
        y: topLeftY,
        fontSize: newFontSize,
        rotation: rotation,
      });
    }
  };

  // Handle transform (scale + rotation) with constraints
  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = textRef.current;
    
    if (node) {
      // Get scale value - use absolute value to prevent flipping
      // Since keepRatio=true, scaleX === scaleY, so we only need to check one
      let currentScale = Math.abs(node.scaleX());
      
      // Constrain scale to keep font size within 6-500pt range
      const minScale = 6 / text.fontSize;
      const maxScale = 500 / text.fontSize;
      
      let wasConstrained = false;
      let finalScale = currentScale;
      
      // Constrain scale to min/max bounds
      if (finalScale < minScale) {
        finalScale = minScale;
        wasConstrained = true;
      } else if (finalScale > maxScale) {
        finalScale = maxScale;
        wasConstrained = true;
      } else {
        // Within valid range, update last valid center
        lastValidCenterRef.current = {
          x: node.x(),
          y: node.y(),
        };
      }
      
      // Always apply positive scale values to prevent flipping
      node.scaleX(finalScale);
      node.scaleY(finalScale);
      
      // If we constrained the scale, restore the center position
      if (wasConstrained && lastValidCenterRef.current) {
        node.x(lastValidCenterRef.current.x);
        node.y(lastValidCenterRef.current.y);
      }
      
      // Handle rotation snapping (only if not scaling)
      const isShiftPressed = e.evt && 'shiftKey' in e.evt && e.evt.shiftKey;
      
      if (!isShiftPressed) {
        // Snap rotation to 15° increments
        const rotation = node.rotation();
        const snappedRotation = Math.round(rotation / 15) * 15;
        node.rotation(snappedRotation);
      }
    }
  };

  // Start editing when text is selected
  useEffect(() => {
    if (isSelected && mode === 'text') {
      setIsEditing(true);
      setEditText(text.text);
    } else {
      setIsEditing(false);
    }
  }, [isSelected, mode, text.text]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Allow selection in any mode
    e.cancelBubble = true;
    
    if (isSelected) {
      // If already selected, trigger the modal edit (this will be handled by Canvas component)
      onClick(text.id, e.evt.shiftKey);
    } else {
      // If not selected, select the text object
      onClick(text.id, e.evt.shiftKey);
    }
  };

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // Double-click always opens edit modal
    setIsEditing(true);
    setEditText(text.text);
  };

  const handleDragStartEvent = () => {
    if (onDragStart) {
      onDragStart(text.id);
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragMove) {
      const node = e.target as Konva.Text;
      const centerX = node.x();
      const centerY = node.y();
      const width = node.width();
      const height = node.height();
      
      // Convert from center position back to top-left
      const topLeftX = centerX - width / 2;
      const topLeftY = centerY - height / 2;
      
      onDragMove(text.id, topLeftX, topLeftY);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Text;
    const centerX = node.x();
    const centerY = node.y();
    const width = node.width();
    const height = node.height();
    
    // Convert from center position back to top-left
    const topLeftX = centerX - width / 2;
    const topLeftY = centerY - height / 2;
    
    onDragEnd(text.id, topLeftX, topLeftY);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Finish editing on Enter
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      // Cancel editing on Escape
      setIsEditing(false);
      setEditText(text.text);
    }
  };

  const handleFinishEditing = () => {
    if (editText.trim() !== '') {
      onTextChange(text.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleFinishEditing();
  };

  // Get text dimensions for centering
  const textWidth = textRef.current?.width() || 0;
  const textHeight = textRef.current?.height() || 0;

  return (
    <>
      <KonvaText
        ref={textRef}
        id={text.id}
        x={text.x + textWidth / 2}
        y={text.y + textHeight / 2}
        text={isEditing ? editText : text.text}
        fontSize={text.fontSize}
        fill={text.fill}
        rotation={text.rotation || 0}
        offsetX={textWidth / 2}
        offsetY={textHeight / 2}
        fontFamily="Arial, sans-serif"
        fontStyle={`${text.bold ? 'bold' : ''} ${text.italic ? 'italic' : ''}`.trim() || 'normal'}
        textDecoration={text.underline ? 'underline' : ''}
        draggable={(isDraggable !== undefined ? isDraggable : isSelected) && !isEditing}
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
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 1 : 0}
      />
      
      {/* Inline text editor */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            left: text.x,
            top: text.y,
            zIndex: 1000,
            background: 'white',
            border: '2px solid #3B82F6',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: `${text.fontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: text.fill,
            minWidth: '100px',
            outline: 'none',
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setEditText(e.currentTarget.textContent || '')}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
        >
          {editText}
        </div>
      )}

      {isSelected && !isEditing && (
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
          rotateEnabled={showTransformer}
          rotateAnchorOffset={20}
          keepRatio={true}
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
});
