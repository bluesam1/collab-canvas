import { useRef, useState, useEffect, useContext } from 'react';
import { Stage, Layer, Line as KonvaLine, Rect, Circle as KonvaCircle } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Line } from './Line';
import { Text } from './Text';
import { TextEditModal } from './TextEditModal';
import { isRectangle, isCircle, isLine, isText } from '../../types';
import type { Shape } from '../../types';
import { Cursor } from './Cursor';
import { useCanvas } from '../../hooks/useCanvas';
import { usePresence } from '../../hooks/usePresence';
import { UserContext } from '../../contexts/UserContext';

// Canvas configuration
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SPEED = 0.1;
const GRID_SIZE = 50;

// Rectangle constraints
const MIN_RECT_SIZE = 10;
const MAX_RECT_SIZE = 2000;

interface CanvasProps {
  selectedColor: string;
  lineThickness: number;
  showInfo: boolean;
}

export function Canvas({ selectedColor, lineThickness, showInfo }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasAutoFitted, setHasAutoFitted] = useState(false);
  const [multiSelectDragStart, setMultiSelectDragStart] = useState<Map<string, { x: number; y: number }> | null>(null);
  const [multiSelectDragOffset, setMultiSelectDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Shape creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newShapeStart, setNewShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapeEnd, setNewShapeEnd] = useState<{ x: number; y: number } | null>(null);
  const justFinishedCreatingRef = useRef(false);

  // Selection box state
  const [selectionBoxStart, setSelectionBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBoxEnd, setSelectionBoxEnd] = useState<{ x: number; y: number } | null>(null);

  // Text modal state
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const [textModalPosition, setTextModalPosition] = useState({ x: 0, y: 0 });
  const [textModalFontSize, setTextModalFontSize] = useState(16);
  const [textModalBold, setTextModalBold] = useState(false);
  const [textModalItalic, setTextModalItalic] = useState(false);
  const [textModalUnderline, setTextModalUnderline] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textModalKey, setTextModalKey] = useState(0);


  // Canvas context and user context
  const { objects, selectedIds, isLoading, mode, setMode, createObject, updateObject, selectObject, selectMultiple, clearSelection, deleteSelected } = useCanvas();
  const { cursors, updateCursor } = usePresence();
  const authContext = useContext(UserContext);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-fit canvas to show all objects on initial load
  useEffect(() => {
    if (!isLoading && !hasAutoFitted && objects.length > 0) {
      setHasAutoFitted(true);

      // Calculate visible canvas area (accounting for toolbar and header)
      const toolbarWidth = 64; // w-16 = 64px
      const headerHeight = 64; // Approximate header height
      const visibleWidth = stageSize.width - toolbarWidth;
      const visibleHeight = stageSize.height - headerHeight;

      // Calculate bounding box of all objects
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      objects.forEach((obj) => {
        if (isRectangle(obj)) {
          // Account for rotation by getting the bounding box
          const centerX = obj.x + obj.width / 2;
          const centerY = obj.y + obj.height / 2;
          const rad = (obj.rotation * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rad));
          const sin = Math.abs(Math.sin(rad));
          const rotatedWidth = obj.width * cos + obj.height * sin;
          const rotatedHeight = obj.width * sin + obj.height * cos;
          
          minX = Math.min(minX, centerX - rotatedWidth / 2);
          minY = Math.min(minY, centerY - rotatedHeight / 2);
          maxX = Math.max(maxX, centerX + rotatedWidth / 2);
          maxY = Math.max(maxY, centerY + rotatedHeight / 2);
        } else if (isCircle(obj)) {
          minX = Math.min(minX, obj.centerX - obj.radius);
          minY = Math.min(minY, obj.centerY - obj.radius);
          maxX = Math.max(maxX, obj.centerX + obj.radius);
          maxY = Math.max(maxY, obj.centerY + obj.radius);
        } else if (isLine(obj)) {
          // Lines are stored as x, y, width, rotation
          const rad = (obj.rotation * Math.PI) / 180;
          const endX = obj.x + obj.width * Math.cos(rad);
          const endY = obj.y + obj.width * Math.sin(rad);
          
          minX = Math.min(minX, obj.x, endX);
          minY = Math.min(minY, obj.y, endY);
          maxX = Math.max(maxX, obj.x, endX);
          maxY = Math.max(maxY, obj.y, endY);
        } else if (isText(obj)) {
          // Approximate text size (actual rendering may vary)
          const textWidth = obj.text.length * obj.fontSize * 0.6;
          const textHeight = obj.fontSize * 1.2;
          
          const centerX = obj.x + textWidth / 2;
          const centerY = obj.y + textHeight / 2;
          const rad = (obj.rotation * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rad));
          const sin = Math.abs(Math.sin(rad));
          const rotatedWidth = textWidth * cos + textHeight * sin;
          const rotatedHeight = textWidth * sin + textHeight * cos;
          
          minX = Math.min(minX, centerX - rotatedWidth / 2);
          minY = Math.min(minY, centerY - rotatedHeight / 2);
          maxX = Math.max(maxX, centerX + rotatedWidth / 2);
          maxY = Math.max(maxY, centerY + rotatedHeight / 2);
        }
      });

      // Add generous padding around objects (10% of visible area or min 80px)
      const paddingX = Math.max(visibleWidth * 0.1, 80);
      const paddingY = Math.max(visibleHeight * 0.1, 80);
      minX -= paddingX;
      minY -= paddingY;
      maxX += paddingX;
      maxY += paddingY;

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;

      // Calculate scale to fit all objects (default to 1.0, only zoom out if necessary)
      const scaleX = visibleWidth / contentWidth;
      const scaleY = visibleHeight / contentHeight;
      const newScale = Math.min(1, Math.min(scaleX, scaleY)); // Don't zoom in beyond 100%

      // Calculate position to center the content in the visible area
      // Account for toolbar on left and header on top
      const visibleCenterX = toolbarWidth + visibleWidth / 2;
      const visibleCenterY = headerHeight + visibleHeight / 2;
      
      const newX = visibleCenterX - contentCenterX * newScale;
      const newY = visibleCenterY - contentCenterY * newScale;

      setStageScale(newScale);
      setStagePos({ x: newX, y: newY });
    } else if (!isLoading && !hasAutoFitted && objects.length === 0) {
      // No objects - center on canvas origin in the visible area
      setHasAutoFitted(true);
      const toolbarWidth = 64;
      const headerHeight = 64;
      const visibleWidth = stageSize.width - toolbarWidth;
      const visibleHeight = stageSize.height - headerHeight;
      
      setStageScale(1);
      setStagePos({ 
        x: toolbarWidth + visibleWidth / 2, 
        y: headerHeight + visibleHeight / 2 
      });
    }
  }, [isLoading, hasAutoFitted, objects, stageSize]);

  // Cursor logic is handled by the Stage component


  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        clearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        // Delete all selected shapes
        e.preventDefault(); // Prevent browser back navigation on Backspace
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // Ctrl/Cmd + A: Select all shapes
        e.preventDefault();
        const allShapeIds = objects.map(obj => obj.id);
        selectMultiple(allShapeIds);
      } else if (e.key.toLowerCase() === 'v') {
        // Switch to Pan mode
        setMode('pan');
      } else if (e.key.toLowerCase() === 's') {
        // Switch to Select mode
        setMode('select');
      } else if (e.key.toLowerCase() === 'r') {
        // Switch to Rectangle mode
        setMode('rectangle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, deleteSelected, selectedIds, setMode, objects, selectMultiple]);

  // Handle mouse down for panning or rectangle creation
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Reset the flag on any new mouse down
    justFinishedCreatingRef.current = false;
    
    // If clicking on empty space (stage background)
    const clickedOnEmpty = e.target === e.target.getStage();

    // Deselect when clicking on empty space (in any mode), unless Shift is held
    if (clickedOnEmpty && !e.evt.shiftKey) {
      clearSelection();
    }

    // Handle based on current mode
    if (e.evt.button === 0) {  // Left mouse button
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };

          if (mode === 'rectangle' || mode === 'circle' || mode === 'line') {
            // Shape creation modes: Start creating shape (works even over existing shapes)
            setNewShapeStart(worldPos);
            setIsCreating(true);
          } else if (mode === 'text') {
            // Text mode: Show text modal
            setTextModalPosition(worldPos);
            setTextModalValue('');
            setTextModalFontSize(16);
            setTextModalBold(false);
            setTextModalItalic(false);
            setTextModalUnderline(false);
            setEditingTextId(null);
            setTextModalKey(prev => prev + 1); // Force modal remount
            setIsTextModalOpen(true);
          } else if (mode === 'select' && clickedOnEmpty) {
            // Select mode: Start selection box only on empty space
            setSelectionBoxStart(worldPos);
            setSelectionBoxEnd(worldPos);
          } else if (mode === 'pan' && clickedOnEmpty) {
            // Pan mode: Start panning only on empty space
            setIsPanning(true);
            const stagePos = stage.position();
            setDragStart({
              x: e.evt.clientX - stagePos.x,
              y: e.evt.clientY - stagePos.y,
            });
          }
        }
      }
    } else if (e.evt.button === 1) {
      // Middle button always pans regardless of mode
      setIsPanning(true);
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.position();
        setDragStart({
          x: e.evt.clientX - pos.x,
          y: e.evt.clientY - pos.y,
        });
      }
    }
  };

  // Handle mouse move for panning or rectangle creation
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    
    // Broadcast cursor position (world coordinates)
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const worldPos = {
          x: (pos.x - stage.x()) / stage.scaleX(),
          y: (pos.y - stage.y()) / stage.scaleY(),
        };
        // Update cursor position (throttled in PresenceContext)
        updateCursor(worldPos);
      }
    }
    
    if (isPanning) {
      const newPos = {
        x: e.evt.clientX - dragStart.x,
        y: e.evt.clientY - dragStart.y,
      };

      // Animate the position change
      if (stage) {
        stage.to({
          x: newPos.x,
          y: newPos.y,
          duration: 0.05,
          easing: Konva.Easings.EaseOut,
        });
        setStagePos(newPos);
      }
    } else if (isCreating && newShapeStart) {
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };
          setNewShapeEnd(worldPos);
        }
      }
    } else if (selectionBoxStart) {
      // Update selection box end position
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const worldPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY(),
          };
          setSelectionBoxEnd(worldPos);
        }
      }
    }
  };

  // Handle mouse up to stop panning or create rectangle
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isCreating && newShapeStart && newShapeEnd) {
      if (authContext?.user) {
        if (mode === 'rectangle') {
          // Calculate rectangle dimensions
          const width = Math.abs(newShapeEnd.x - newShapeStart.x);
          const height = Math.abs(newShapeEnd.y - newShapeStart.y);

          // Only create if dragged enough (minimum size)
          if (width >= MIN_RECT_SIZE && height >= MIN_RECT_SIZE) {
            // Enforce maximum size
            const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
            const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

            const x = Math.min(newShapeStart.x, newShapeEnd.x);
            const y = Math.min(newShapeStart.y, newShapeEnd.y);

            createObject({
              type: 'rectangle',
              x,
              y,
              width: constrainedWidth,
              height: constrainedHeight,
              fill: selectedColor,
              rotation: 0,
              createdBy: authContext.user.uid,
            });
            
            // Mark that we just created a shape to prevent selecting underlying shapes
            justFinishedCreatingRef.current = true;
          }
        } else if (mode === 'circle') {
          // Calculate circle center and radius
          const centerX = (newShapeStart.x + newShapeEnd.x) / 2;
          const centerY = (newShapeStart.y + newShapeEnd.y) / 2;
          const radius = Math.sqrt(
            Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
            Math.pow(newShapeEnd.y - newShapeStart.y, 2)
          ) / 2;

          // Only create if dragged enough (minimum radius)
          if (radius >= MIN_RECT_SIZE / 2) {
            const constrainedRadius = Math.min(radius, MAX_RECT_SIZE / 2);

            createObject({
              type: 'circle',
              centerX,
              centerY,
              radius: constrainedRadius,
              fill: selectedColor,
              rotation: 0,
              createdBy: authContext.user.uid,
            });
            
            // Mark that we just created a shape to prevent selecting underlying shapes
            justFinishedCreatingRef.current = true;
          }
        } else if (mode === 'line') {
          // Calculate line length
          const length = Math.sqrt(
            Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
            Math.pow(newShapeEnd.y - newShapeStart.y, 2)
          );

          // Only create if dragged enough (minimum length)
          if (length >= 10) {
            const maxLength = 5000;
            const constrainedLength = Math.min(length, maxLength);
            
            // Calculate angle in degrees for rotation
            const angleRadians = Math.atan2(newShapeEnd.y - newShapeStart.y, newShapeEnd.x - newShapeStart.x);
            const angleDegrees = (angleRadians * 180) / Math.PI;

            createObject({
              type: 'line',
              x: newShapeStart.x,
              y: newShapeStart.y,
              width: constrainedLength,
              height: 0,
              stroke: selectedColor,
              strokeWidth: lineThickness,
              rotation: angleDegrees,
              createdBy: authContext.user.uid,
            });
            
            // Mark that we just created a shape to prevent selecting underlying shapes
            justFinishedCreatingRef.current = true;
          }
        }
      }

      // Reset creation state
      setIsCreating(false);
      setNewShapeStart(null);
      setNewShapeEnd(null);
    } else if (selectionBoxStart && selectionBoxEnd) {
      // Selection box: Select all shapes completely within the box
      const minX = Math.min(selectionBoxStart.x, selectionBoxEnd.x);
      const maxX = Math.max(selectionBoxStart.x, selectionBoxEnd.x);
      const minY = Math.min(selectionBoxStart.y, selectionBoxEnd.y);
      const maxY = Math.max(selectionBoxStart.y, selectionBoxEnd.y);
      
      // Find all shapes completely within the selection box
      const selectedShapeIds: string[] = [];
      
      objects.forEach((shape) => {
        let isCompletelyWithin = false;
        
        if (isRectangle(shape)) {
          // For rectangles, check if all corners are within bounds (accounting for rotation)
          const centerX = shape.x + shape.width / 2;
          const centerY = shape.y + shape.height / 2;
          const rad = (shape.rotation * Math.PI) / 180;
          
          // Calculate rotated corners
          const corners = [
            { x: -shape.width / 2, y: -shape.height / 2 },
            { x: shape.width / 2, y: -shape.height / 2 },
            { x: shape.width / 2, y: shape.height / 2 },
            { x: -shape.width / 2, y: shape.height / 2 },
          ].map(corner => ({
            x: centerX + corner.x * Math.cos(rad) - corner.y * Math.sin(rad),
            y: centerY + corner.x * Math.sin(rad) + corner.y * Math.cos(rad),
          }));
          
          isCompletelyWithin = corners.every(
            corner => corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY
          );
        } else if (isCircle(shape)) {
          // For circles, check if the entire circle (center +/- radius) is within bounds
          isCompletelyWithin =
            shape.centerX - shape.radius >= minX &&
            shape.centerX + shape.radius <= maxX &&
            shape.centerY - shape.radius >= minY &&
            shape.centerY + shape.radius <= maxY;
        } else if (isLine(shape)) {
          // For lines, check if both endpoints are within bounds
          const rad = (shape.rotation * Math.PI) / 180;
          const endX = shape.x + shape.width * Math.cos(rad);
          const endY = shape.y + shape.width * Math.sin(rad);
          
          isCompletelyWithin =
            shape.x >= minX && shape.x <= maxX && shape.y >= minY && shape.y <= maxY &&
            endX >= minX && endX <= maxX && endY >= minY && endY <= maxY;
        } else if (isText(shape)) {
          // For text, check if all corners are within bounds (accounting for rotation)
          const textWidth = shape.text.length * shape.fontSize * 0.6;
          const textHeight = shape.fontSize * 1.2;
          const centerX = shape.x + textWidth / 2;
          const centerY = shape.y + textHeight / 2;
          const rad = (shape.rotation * Math.PI) / 180;
          
          // Calculate rotated corners
          const corners = [
            { x: -textWidth / 2, y: -textHeight / 2 },
            { x: textWidth / 2, y: -textHeight / 2 },
            { x: textWidth / 2, y: textHeight / 2 },
            { x: -textWidth / 2, y: textHeight / 2 },
          ].map(corner => ({
            x: centerX + corner.x * Math.cos(rad) - corner.y * Math.sin(rad),
            y: centerY + corner.x * Math.sin(rad) + corner.y * Math.cos(rad),
          }));
          
          isCompletelyWithin = corners.every(
            corner => corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY
          );
        }
        
        if (isCompletelyWithin) {
          selectedShapeIds.push(shape.id);
        }
      });
      
      // Select the shapes
      if (selectedShapeIds.length > 0) {
        selectMultiple(selectedShapeIds);
      }
      
      // Reset selection box
      setSelectionBoxStart(null);
      setSelectionBoxEnd(null);
    } else {
      // If no drag occurred, just reset
      setIsCreating(false);
      setNewShapeStart(null);
      setNewShapeEnd(null);
      setSelectionBoxStart(null);
      setSelectionBoxEnd(null);
    }
  };

  // Handle wheel event for zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and new scale
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, oldScale + direction * ZOOM_SPEED)
    );

    if (newScale === oldScale) return;

    // Calculate new position to zoom towards cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // Animate the zoom and pan
    stage.to({
      x: newPos.x,
      y: newPos.y,
      scaleX: newScale,
      scaleY: newScale,
      duration: 0.1,
      easing: Konva.Easings.EaseOut,
    });

    setStageScale(newScale);
    setStagePos(newPos);
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const padding = 1000; // Extra padding for pan/zoom

    // Vertical lines
    for (let i = -padding; i <= CANVAS_WIDTH + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, -padding, i, CANVAS_HEIGHT + padding]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let i = -padding; i <= CANVAS_HEIGHT + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[-padding, i, CANVAS_WIDTH + padding, i]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    return lines;
  };

  // Handle shape selection (supports Shift+click for multi-select)
  const handleShapeClick = (id: string, shiftKey: boolean = false) => {
    // Prevent selecting underlying shapes immediately after creating a shape
    if (justFinishedCreatingRef.current) {
      justFinishedCreatingRef.current = false;
      return;
    }
    
    selectObject(id, shiftKey);
  };

  // Handle rectangle drag move
  const handleRectangleDragMove = (id: string, x: number, y: number) => {
    updateCursor({ x, y });
    
    // For multi-select, track the drag offset for real-time visual feedback
    if (selectedIds.length > 1 && multiSelectDragStart) {
      const originalPos = multiSelectDragStart.get(id);
      if (originalPos) {
        const offsetX = x - originalPos.x;
        const offsetY = y - originalPos.y;
        
        // Update the drag offset for real-time rendering
        setMultiSelectDragOffset({ x: offsetX, y: offsetY });
      }
    }
  };

  // Handle drag start for multi-select
  const handleDragStart = (_id: string) => {
    if (selectedIds.length > 1) {
      // Capture initial positions of all selected shapes
      const initialPositions = new Map<string, { x: number; y: number }>();
      selectedIds.forEach(selectedId => {
        const shape = objects.find(obj => obj.id === selectedId);
        if (shape) {
          if (isRectangle(shape) || isText(shape)) {
            initialPositions.set(selectedId, { x: shape.x, y: shape.y });
          } else if (isCircle(shape)) {
            initialPositions.set(selectedId, { x: shape.centerX, y: shape.centerY });
          } else if (isLine(shape)) {
            initialPositions.set(selectedId, { x: shape.x, y: shape.y });
          }
        }
      });
      setMultiSelectDragStart(initialPositions);
    }
  };

  // Handle rectangle drag end
  const handleRectangleDragEnd = (id: string, x: number, y: number) => {
    if (selectedIds.length > 1 && multiSelectDragStart) {
      // Multi-select: commit final positions for all selected shapes
      const originalPos = multiSelectDragStart.get(id);
      if (originalPos) {
        const offsetX = x - originalPos.x;
        const offsetY = y - originalPos.y;

        // Batch commit all final positions to Firebase
        selectedIds.forEach(selectedId => {
          const initialPos = multiSelectDragStart.get(selectedId);
          if (initialPos) {
            const shape = objects.find(obj => obj.id === selectedId);
            if (shape) {
              if (isRectangle(shape) || isText(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              } else if (isCircle(shape)) {
                updateObject(selectedId, {
                  centerX: initialPos.x + offsetX,
                  centerY: initialPos.y + offsetY,
                });
              } else if (isLine(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              }
            }
          }
        });
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      updateObject(id, { x, y });
    }
  };

  // Handle circle drag end
  const handleCircleDragEnd = (id: string, centerX: number, centerY: number) => {
    if (selectedIds.length > 1 && multiSelectDragStart) {
      // Multi-select: commit final positions for all selected shapes
      const originalPos = multiSelectDragStart.get(id);
      if (originalPos) {
        const offsetX = centerX - originalPos.x;
        const offsetY = centerY - originalPos.y;

        // Batch commit all final positions to Firebase
        selectedIds.forEach(selectedId => {
          const initialPos = multiSelectDragStart.get(selectedId);
          if (initialPos) {
            const shape = objects.find(obj => obj.id === selectedId);
            if (shape) {
              if (isRectangle(shape) || isText(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              } else if (isCircle(shape)) {
                updateObject(selectedId, {
                  centerX: initialPos.x + offsetX,
                  centerY: initialPos.y + offsetY,
                });
              } else if (isLine(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              }
            }
          }
        });
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      updateObject(id, { centerX, centerY });
    }
  };

  // Handle shape transform (resize/rotate, and also drag end for lines)
  const handleShapeTransform = (id: string, updates: Partial<Shape>) => {
    // Check if this is a line drag (only x, y updates) when multiple shapes are selected
    if (selectedIds.length > 1 && multiSelectDragStart && 'x' in updates && 'y' in updates && Object.keys(updates).length === 2) {
      // This is a line being dragged in multi-select
      const originalPos = multiSelectDragStart.get(id);
      if (originalPos) {
        const offsetX = updates.x! - originalPos.x;
        const offsetY = updates.y! - originalPos.y;

        // Batch commit all final positions to Firebase
        selectedIds.forEach(selectedId => {
          const initialPos = multiSelectDragStart.get(selectedId);
          if (initialPos) {
            const shape = objects.find(obj => obj.id === selectedId);
            if (shape) {
              if (isRectangle(shape) || isText(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              } else if (isCircle(shape)) {
                updateObject(selectedId, {
                  centerX: initialPos.x + offsetX,
                  centerY: initialPos.y + offsetY,
                });
              } else if (isLine(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              }
            }
          }
        });
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select or actual transform (not drag)
      updateObject(id, updates);
    }
  };

  // Handle text drag end
  const handleTextDragEnd = (id: string, x: number, y: number) => {
    if (selectedIds.length > 1 && multiSelectDragStart) {
      // Multi-select: commit final positions for all selected shapes
      const originalPos = multiSelectDragStart.get(id);
      if (originalPos) {
        const offsetX = x - originalPos.x;
        const offsetY = y - originalPos.y;

        // Batch commit all final positions to Firebase
        selectedIds.forEach(selectedId => {
          const initialPos = multiSelectDragStart.get(selectedId);
          if (initialPos) {
            const shape = objects.find(obj => obj.id === selectedId);
            if (shape) {
              if (isRectangle(shape) || isText(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              } else if (isCircle(shape)) {
                updateObject(selectedId, {
                  centerX: initialPos.x + offsetX,
                  centerY: initialPos.y + offsetY,
                });
              } else if (isLine(shape)) {
                updateObject(selectedId, {
                  x: initialPos.x + offsetX,
                  y: initialPos.y + offsetY,
                });
              }
            }
          }
        });
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      updateObject(id, { x, y });
    }
  };

  // Handle text click - select first, then open modal for editing
  const handleTextClick = (id: string, shiftKey: boolean = false) => {
    // Prevent selecting underlying shapes immediately after creating a shape
    if (justFinishedCreatingRef.current) {
      justFinishedCreatingRef.current = false;
      return;
    }
    
    const textObject = objects.find(obj => obj.id === id && isText(obj));
    if (textObject && isText(textObject)) {
      if (selectedIds.includes(id) && !shiftKey) {
        // If already selected and not shift-clicking, open edit modal
        setEditingTextId(id);
        setTextModalValue(textObject.text);
        setTextModalFontSize(textObject.fontSize || 16);
        setTextModalBold(textObject.bold || false);
        setTextModalItalic(textObject.italic || false);
        setTextModalUnderline(textObject.underline || false);
        setIsTextModalOpen(true);
      } else {
        // If not selected, or shift-clicking, just select it
        selectObject(id, shiftKey);
      }
    }
  };

  // Handle text change (for double-click inline editing - deprecated but keeping for compatibility)
  const handleTextChange = (id: string, newText: string) => {
    updateObject(id, { text: newText });
  };

  // Handle text modal save
  const handleTextModalSave = (text: string, fontSize: number, bold: boolean, italic: boolean, underline: boolean) => {
    if (editingTextId) {
      // Editing existing text
      updateObject(editingTextId, { text, fontSize, bold, italic, underline });
    } else if (authContext?.user) {
      // Creating new text
      createObject({
        type: 'text',
        x: textModalPosition.x,
        y: textModalPosition.y,
        text,
        fontSize,
        fill: selectedColor,
        rotation: 0,
        bold,
        italic,
        underline,
        createdBy: authContext.user.uid,
      });
    }
    setIsTextModalOpen(false);
    setEditingTextId(null);
    // Reset modal state
    setTextModalValue('');
    setTextModalFontSize(16);
    setTextModalBold(false);
    setTextModalItalic(false);
    setTextModalUnderline(false);
  };

  const handleTextModalCancel = () => {
    setIsTextModalOpen(false);
    setEditingTextId(null);
    // Reset modal state
    setTextModalValue('');
    setTextModalFontSize(16);
    setTextModalBold(false);
    setTextModalItalic(false);
    setTextModalUnderline(false);
  };


  // Calculate preview shape dimensions
  const getPreviewShape = () => {
    if (!isCreating || !newShapeStart || !newShapeEnd) return null;

    if (mode === 'rectangle') {
      const width = Math.abs(newShapeEnd.x - newShapeStart.x);
      const height = Math.abs(newShapeEnd.y - newShapeStart.y);

      // Only show preview if dragged enough
      if (width < MIN_RECT_SIZE || height < MIN_RECT_SIZE) return null;

      // Constrain to maximum size
      const constrainedWidth = Math.min(width, MAX_RECT_SIZE);
      const constrainedHeight = Math.min(height, MAX_RECT_SIZE);

      const x = Math.min(newShapeStart.x, newShapeEnd.x);
      const y = Math.min(newShapeStart.y, newShapeEnd.y);

      return { type: 'rectangle', x, y, width: constrainedWidth, height: constrainedHeight };
    } else if (mode === 'circle') {
      const centerX = (newShapeStart.x + newShapeEnd.x) / 2;
      const centerY = (newShapeStart.y + newShapeEnd.y) / 2;
      const radius = Math.sqrt(
        Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
        Math.pow(newShapeEnd.y - newShapeStart.y, 2)
      ) / 2;

      if (radius < MIN_RECT_SIZE / 2) return null;

      const constrainedRadius = Math.min(radius, MAX_RECT_SIZE / 2);

      return { type: 'circle', centerX, centerY, radius: constrainedRadius };
    } else if (mode === 'line') {
      const length = Math.sqrt(
        Math.pow(newShapeEnd.x - newShapeStart.x, 2) + 
        Math.pow(newShapeEnd.y - newShapeStart.y, 2)
      );

      if (length < 10) return null;

      const maxLength = 5000;
      const constrainedLength = Math.min(length, maxLength);
      
      const angle = Math.atan2(newShapeEnd.y - newShapeStart.y, newShapeEnd.x - newShapeStart.x);

      return { 
        type: 'line', 
        x: newShapeStart.x, 
        y: newShapeStart.y, 
        width: constrainedLength,
        rotation: (angle * 180) / Math.PI
      };
    }

    return null;
  };

  const previewShape = getPreviewShape();

  // Show loading indicator while fetching initial data
  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-600 font-medium">Loading canvas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isPanning 
            ? 'grabbing' 
            : isCreating 
            ? 'crosshair' 
            : mode === 'pan'
            ? 'grab'
            : 'crosshair'
        }}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Objects layer */}
        <Layer>
          {/* Render unselected shapes first */}
          {objects.filter(shape => !selectedIds.includes(shape.id)).map((shape) => {
            if (isRectangle(shape)) {
              return (
                <Rectangle
                  key={shape.id}
                  rectangle={shape}
                  isSelected={false}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleRectangleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                />
              );
            } else if (isCircle(shape)) {
              return (
                <Circle
                  key={shape.id}
                  circle={shape}
                  isSelected={false}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleCircleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                />
              );
            } else if (isLine(shape)) {
              return (
                <Line
                  key={shape.id}
                  line={shape}
                  isSelected={false}
                  onClick={(id, shiftKey) => handleShapeClick(id, shiftKey)}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onTransform={handleShapeTransform}
                  mode={mode}
                />
              );
            } else if (isText(shape)) {
              return (
                <Text
                  key={shape.id}
                  text={shape}
                  isSelected={false}
                  onClick={handleTextClick}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onDragEnd={(id, x, y) => handleTextDragEnd(id, x, y)}
                  onTextChange={handleTextChange}
                  onTransform={handleShapeTransform}
                  mode={mode}
                />
              );
            }
            return null;
          })}

          {/* Render selected shapes last (transformers will be on top) */}
          {objects.filter(shape => selectedIds.includes(shape.id)).map((shape) => {
            // Only show transformers when a single shape is selected
            const showTransformer = selectedIds.length === 1;
            
            // Apply multi-select drag offset for real-time visual feedback
            let adjustedShape = shape;
            if (multiSelectDragOffset && multiSelectDragStart && selectedIds.length > 1) {
              const initialPos = multiSelectDragStart.get(shape.id);
              if (initialPos) {
                if (isRectangle(shape) || isText(shape)) {
                  adjustedShape = {
                    ...shape,
                    x: initialPos.x + multiSelectDragOffset.x,
                    y: initialPos.y + multiSelectDragOffset.y,
                  };
                } else if (isCircle(shape)) {
                  adjustedShape = {
                    ...shape,
                    centerX: initialPos.x + multiSelectDragOffset.x,
                    centerY: initialPos.y + multiSelectDragOffset.y,
                  };
                } else if (isLine(shape)) {
                  adjustedShape = {
                    ...shape,
                    x: initialPos.x + multiSelectDragOffset.x,
                    y: initialPos.y + multiSelectDragOffset.y,
                  };
                }
              }
            }
            
            if (isRectangle(adjustedShape)) {
              return (
                <Rectangle
                  key={shape.id}
                  rectangle={adjustedShape}
                  isSelected={true}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleRectangleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                />
              );
            } else if (isCircle(adjustedShape)) {
              return (
                <Circle
                  key={shape.id}
                  circle={adjustedShape}
                  isSelected={true}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleCircleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                />
              );
            } else if (isLine(adjustedShape)) {
              return (
                <Line
                  key={shape.id}
                  line={adjustedShape}
                  isSelected={true}
                  onClick={(id, shiftKey) => handleShapeClick(id, shiftKey)}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                />
              );
            } else if (isText(adjustedShape)) {
              return (
                <Text
                  key={shape.id}
                  text={adjustedShape}
                  isSelected={true}
                  onClick={handleTextClick}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onDragEnd={(id, x, y) => handleTextDragEnd(id, x, y)}
                  onTextChange={handleTextChange}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                />
              );
            }
            return null;
          })}

          {/* Preview shape during creation */}
          {previewShape && (
            <>
              {previewShape.type === 'rectangle' && 'x' in previewShape && (
                <Rect
                  x={(previewShape as any).x}
                  y={(previewShape as any).y}
                  width={(previewShape as any).width}
                  height={(previewShape as any).height}
                  fill={selectedColor}
                  opacity={0.5}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[10, 5]}
                  listening={false}
                />
              )}
              {previewShape.type === 'circle' && 'centerX' in previewShape && (
                <KonvaCircle
                  x={(previewShape as any).centerX}
                  y={(previewShape as any).centerY}
                  radius={(previewShape as any).radius}
                  fill={selectedColor}
                  opacity={0.5}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[10, 5]}
                  listening={false}
                />
              )}
              {previewShape.type === 'line' && 'x' in previewShape && newShapeStart && newShapeEnd && (
                <KonvaLine
                  points={[
                    newShapeStart.x,
                    newShapeStart.y,
                    newShapeEnd.x,
                    newShapeEnd.y
                  ]}
                  stroke={selectedColor}
                  strokeWidth={lineThickness}
                  opacity={0.5}
                  dash={[10, 5]}
                  listening={false}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </>
          )}

          {/* Selection box */}
          {selectionBoxStart && selectionBoxEnd && (
            <Rect
              x={Math.min(selectionBoxStart.x, selectionBoxEnd.x)}
              y={Math.min(selectionBoxStart.y, selectionBoxEnd.y)}
              width={Math.abs(selectionBoxEnd.x - selectionBoxStart.x)}
              height={Math.abs(selectionBoxEnd.y - selectionBoxStart.y)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3B82F6"
              strokeWidth={1}
              dash={[5, 5]}
              listening={false}
            />
          )}
        </Layer>

        {/* Cursors layer */}
        <Layer listening={false}>
          {/* Render remote cursors */}
          {Array.from(cursors.entries()).map(([userId, cursor]) => (
            <Cursor
              key={userId}
              x={cursor.x}
              y={cursor.y}
              email={cursor.email}
              color={cursor.color}
            />
          ))}
        </Layer>
      </Stage>

      {/* Canvas info overlay */}
      {showInfo && (
        <div className="absolute bottom-4 left-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm z-30">
          <div className="flex flex-col gap-1">
            <div>
              <span className="font-semibold">Zoom:</span>{' '}
              {(stageScale * 100).toFixed(0)}%
            </div>
            <div>
              <span className="font-semibold">Position:</span>{' '}
              ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})
            </div>
            <div>
              <span className="font-semibold">Objects:</span> {objects.length}
            </div>
            {selectedIds.length > 0 && (
              <div className="text-green-700">
                <span className="font-semibold">Selected:</span> {selectedIds.length}
              </div>
            )}
            <div>
              <span className="font-semibold">Mode:</span>{' '}
              {mode === 'pan' ? '✋ Pan' : mode === 'select' ? '🔲 Multi-Select' : mode === 'rectangle' ? '⬛ Rectangle' : mode === 'circle' ? '⭕ Circle' : mode === 'line' ? '➖ Line' : mode === 'text' ? '📝 Text' : mode}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {mode === 'pan' 
                ? 'Click & drag to pan the canvas'
                : mode === 'select'
                ? 'Click & drag to select multiple objects'
                : mode === 'text'
                ? 'Click to add text • Click objects to select'
                : 'Click & drag to create • Click objects to select'
              }
            </div>
          </div>
        </div>
      )}

      {/* Text edit modal */}
      <TextEditModal
        key={textModalKey}
        isOpen={isTextModalOpen}
        initialText={textModalValue}
        initialFontSize={textModalFontSize}
        initialBold={textModalBold}
        initialItalic={textModalItalic}
        initialUnderline={textModalUnderline}
        onSave={handleTextModalSave}
        onCancel={handleTextModalCancel}
      />
    </div>
  );
}

