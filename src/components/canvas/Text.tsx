import { useRef, useEffect, memo, useState } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Text as TextType, CanvasMode } from '../../types';

interface TextProps {
  text: TextType;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onTextChange: (id: string, newText: string) => void;
  mode: CanvasMode;
}

export const Text = memo(function Text({ 
  text, 
  isSelected, 
  onClick, 
  onDragMove, 
  onDragEnd, 
  onTextChange,
  mode 
}: TextProps) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text.text);
  const [isHovered, setIsHovered] = useState(false);

  // Attach transformer to selected text
  useEffect(() => {
    if (isSelected && textRef.current && transformerRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
    e.cancelBubble = true;
    
    if (isSelected) {
      // If already selected, trigger the modal edit (this will be handled by Canvas component)
      onClick(text.id);
    } else {
      // If not selected, select the text object
      onClick(text.id);
    }
  };

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // Double-click always opens edit modal
    setIsEditing(true);
    setEditText(text.text);
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
    onDragEnd(text.id, e.target.x(), e.target.y());
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

  return (
    <>
      <KonvaText
        ref={textRef}
        id={text.id}
        x={text.x}
        y={text.y}
        text={isEditing ? editText : text.text}
        fontSize={text.fontSize}
        fill={text.fill}
        fontFamily="Arial, sans-serif"
        fontStyle={`${text.bold ? 'bold' : ''} ${text.italic ? 'italic' : ''}`.trim() || 'normal'}
        textDecoration={text.underline ? 'underline' : ''}
        draggable={isSelected && !isEditing}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        shadowColor={isSelected || isHovered ? 'black' : undefined}
        shadowBlur={isSelected ? 10 : isHovered ? 6 : 0}
        shadowOpacity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
        shadowOffsetX={isHovered ? 2 : 0}
        shadowOffsetY={isHovered ? 2 : 0}
        stroke={isSelected ? '#000000' : undefined}
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
