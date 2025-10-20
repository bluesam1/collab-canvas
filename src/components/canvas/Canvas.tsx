import { useRef, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Stage, Layer, Line as KonvaLine, Rect, Circle as KonvaCircle, Transformer } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Line } from './Line';
import { Text } from './Text';
import { TextEditModal } from './TextEditModal';
import { PoofEffect } from './PoofEffect';
import { isRectangle, isCircle, isLine, isText } from '../../types';
import type { Shape } from '../../types';
import { Cursor } from './Cursor';
import { useCanvas } from '../../hooks/useCanvas';
import { usePresence } from '../../hooks/usePresence';
import { UserContext } from '../../contexts/UserContext';
import { useFrameShapes } from '../../hooks/useFrameShapes';
import { useToast } from '../../hooks/useToast';
import { Sparkles } from 'lucide-react';
import { MAX_CANVAS_OBJECTS } from '../../constants/canvas';
import { isPointInPolygon } from '../../utils/canvasHelpers';

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
  onFrameShapesReady?: (frameShapes: (shapes: Shape[]) => void) => void;
  onViewportChange?: (x: number, y: number, scale: number) => void;
  onDeleteWithEffectReady?: (deleteWithEffect: () => void) => void;
  onZoomControlReady?: (controls: { zoomIn: () => void; zoomOut: () => void; zoomReset: () => void }) => void;
}

// Helper function to measure text accurately
const measureText = (text: string, fontSize: number): { width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.font = `${fontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    return {
      width: metrics.width,
      height: fontSize * 1.2 // Approximate line height
    };
  } else {
    // Fallback to simple calculation if canvas context fails
    return {
      width: text.length * fontSize * 0.6,
      height: fontSize * 1.2
    };
  }
};

export function Canvas({ selectedColor, lineThickness, showInfo, onFrameShapesReady, onViewportChange, onDeleteWithEffectReady, onZoomControlReady }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const gridLayerRef = useRef<Konva.Layer>(null); // Grid layer
  const staticLayerRef = useRef<Konva.Layer>(null); // For performance mode caching (unselected shapes)
  const dynamicLayerRef = useRef<Konva.Layer>(null); // For caching selected shapes (when not dragging)
  const multiSelectTransformerRef = useRef<Konva.Transformer>(null); // Multi-select transformer
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasAutoFitted, setHasAutoFitted] = useState(false);
  const [multiSelectDragStart, setMultiSelectDragStart] = useState<Map<string, { x: number; y: number }> | null>(null);
  const [multiSelectDragOffset, setMultiSelectDragOffset] = useState<{ x: number; y: number } | null>(null);
  const handleMouseUpRef = useRef<((e: any) => void) | null>(null);
  const wasPanningRef = useRef(false); // Track if we actually panned (moved mouse)
  const dragOffsetRefForRendering = useRef<{ x: number; y: number } | null>(null); // Track drag offset in ref to avoid re-renders

  // Shape creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newShapeStart, setNewShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapeEnd, setNewShapeEnd] = useState<{ x: number; y: number } | null>(null);
  const justFinishedCreatingRef = useRef(false);

  // Selection box state
  const [selectionBoxStart, setSelectionBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBoxEnd, setSelectionBoxEnd] = useState<{ x: number; y: number } | null>(null);

  // Lasso selection state
  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);

  // Text modal state
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const [textModalPosition, setTextModalPosition] = useState({ x: 0, y: 0 });
  const [textModalFontSize, setTextModalFontSize] = useState(16);
  const [textModalBold, setTextModalBold] = useState(false);
  const [textModalItalic, setTextModalItalic] = useState(false);
  const [textModalUnderline, setTextModalUnderline] = useState(false);
  const [textModalColor, setTextModalColor] = useState('#000000');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textModalKey, setTextModalKey] = useState(0);

  // Poof effect state
  const [poofEffects, setPoofEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);

  // Floating AI button state
  const [floatingAIPosition, setFloatingAIPosition] = useState<{ x: number; y: number } | null>(null);
  const [showFloatingAI, setShowFloatingAI] = useState(false);

  // Canvas context and user context
  const { objects, selectedIds, isLoading, mode, setMode, createObject, updateObject, selectObject, selectMultiple, clearSelection, deleteSelected, undo, redo, captureUndoSnapshot, setDisableUndoCapture } = useCanvas();
  const { cursors, updateCursor } = usePresence();
  const authContext = useContext(UserContext);
  const { showSuccess, showError } = useToast();

  // Zoom control functions
  const zoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const newScale = Math.min(MAX_SCALE, oldScale + ZOOM_SPEED);
    
    if (newScale === oldScale) return;

    // Zoom towards center of viewport
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;

    const mousePointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    };

    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };

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
  }, [stageSize.width, stageSize.height]);

  const zoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const newScale = Math.max(MIN_SCALE, oldScale - ZOOM_SPEED);
    
    if (newScale === oldScale) return;

    // Zoom towards center of viewport
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;

    const mousePointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    };

    const newPos = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };

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
  }, [stageSize.width, stageSize.height]);

  const zoomReset = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.to({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
    });

    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  // Pass zoom controls to parent component
  useEffect(() => {
    if (onZoomControlReady) {
      onZoomControlReady({ zoomIn, zoomOut, zoomReset });
    }
  }, [onZoomControlReady, zoomIn, zoomOut, zoomReset]);

  // Coordinate system helper: Convert screen coordinates to world coordinates
  // This is the core transformation that accounts for pan (stage position) and zoom (scale)
  // Formula: worldCoord = (screenCoord - stagePosition) / scale
  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) {
      return { x: screenX, y: screenY };
    }
    
    // Apply inverse transformation: world = (screen - stagePosition) / scale
    const worldX = (screenX - stage.x()) / stage.scaleX();
    const worldY = (screenY - stage.y()) / stage.scaleY();
    
    return { x: worldX, y: worldY };
  }, []);

  // Viewport culling: Calculate which shapes are visible
  const viewport = useMemo(() => {
    // Add padding for smoother experience when panning
    const padding = 200;
    return {
      x: -stagePos.x / stageScale - padding,
      y: -stagePos.y / stageScale - padding,
      width: stageSize.width / stageScale + padding * 2,
      height: stageSize.height / stageScale + padding * 2,
    };
  }, [stagePos, stageScale, stageSize]);

  // Check if a shape is visible in viewport
  const isShapeVisible = useCallback((shape: Shape): boolean => {
    let minX, minY, maxX, maxY;
    
    if (isRectangle(shape) || isText(shape)) {
      minX = shape.x;
      minY = shape.y;
      if (isRectangle(shape)) {
        maxX = shape.x + shape.width;
        maxY = shape.y + shape.height;
      } else {
        const { width: textWidth, height: textHeight } = measureText(shape.text || '', shape.fontSize || 16);
        maxX = shape.x + textWidth;
        maxY = shape.y + textHeight;
      }
    } else if (isCircle(shape)) {
      minX = shape.centerX - shape.radius;
      minY = shape.centerY - shape.radius;
      maxX = shape.centerX + shape.radius;
      maxY = shape.centerY + shape.radius;
    } else if (isLine(shape)) {
      const rad = (shape.rotation * Math.PI) / 180;
      const endX = shape.x + shape.width * Math.cos(rad);
      const endY = shape.y + shape.width * Math.sin(rad);
      minX = Math.min(shape.x, endX);
      minY = Math.min(shape.y, endY);
      maxX = Math.max(shape.x, endX);
      maxY = Math.max(shape.y, endY);
    } else {
      return true; // Unknown shape type, render it
    }

    // Check if shape intersects viewport
    return !(
      maxX < viewport.x ||
      minX > viewport.x + viewport.width ||
      maxY < viewport.y ||
      minY > viewport.y + viewport.height
    );
  }, [viewport]);

  // Performance mode: split objects into static (unselected) and dynamic (selected) layers
  // Also apply viewport culling (always on)
  const staticObjects = useMemo(() => {
    const unselected = objects.filter(obj => !selectedIds.includes(obj.id));
    return unselected.filter(isShapeVisible); // Viewport culling
  }, [objects, selectedIds, isShapeVisible]);

  const dynamicObjects = useMemo(() => {
    return objects.filter(obj => selectedIds.includes(obj.id));
  }, [objects, selectedIds]);

  // Performance mode: cache static layer (throttled to avoid constant recaching)
  useEffect(() => {
    if (staticLayerRef.current && staticObjects.length > 0) {
      const timer = setTimeout(() => {
        staticLayerRef.current?.cache();
        staticLayerRef.current?.batchDraw();
      }, 100); // Throttle caching by 100ms
      
      return () => clearTimeout(timer);
    } else if (staticLayerRef.current) {
      // Clear cache when performance mode is off
      staticLayerRef.current.clearCache();
    }
  }, [staticObjects]);

  // Performance mode: DISABLED - layer caching breaks transformers
  // Caching converts the layer to a bitmap, preventing transformers from accessing individual nodes
  // This caused transform controls to appear in wrong position after ~100ms delay
  useEffect(() => {
    const dynamicLayer = dynamicLayerRef.current;
    if (!dynamicLayer) return;

    // Always clear cache to ensure transformers work correctly
    dynamicLayer.clearCache();
    dynamicLayer.batchDraw();
  }, [selectedIds.length, multiSelectDragStart, isPanning, dynamicObjects]);

  // Calculate floating AI button position based on selected shapes
  useEffect(() => {
    if (selectedIds.length === 0) {
      setShowFloatingAI(false);
      return;
    }

    const selectedShapes = objects.filter(obj => selectedIds.includes(obj.id));
    if (selectedShapes.length === 0) {
      setShowFloatingAI(false);
      return;
    }

    // Calculate bounding box of all selected shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedShapes.forEach(shape => {
      let shapeMinX, shapeMinY, shapeMaxX, shapeMaxY;

      if (isRectangle(shape)) {
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + shape.width;
        shapeMaxY = shape.y + shape.height;
      } else if (isCircle(shape)) {
        shapeMinX = shape.centerX - shape.radius;
        shapeMinY = shape.centerY - shape.radius;
        shapeMaxX = shape.centerX + shape.radius;
        shapeMaxY = shape.centerY + shape.radius;
      } else if (isLine(shape)) {
        const startX = shape.x;
        const startY = shape.y;
        const rotationRad = ((shape.rotation || 0) * Math.PI) / 180;
        const endX = shape.x + shape.width * Math.cos(rotationRad);
        const endY = shape.y + shape.width * Math.sin(rotationRad);
        shapeMinX = Math.min(startX, endX);
        shapeMinY = Math.min(startY, endY);
        shapeMaxX = Math.max(startX, endX);
        shapeMaxY = Math.max(startY, endY);
      } else if (isText(shape)) {
        // Calculate accurate text dimensions
        const fontSize = shape.fontSize || 16;
        const text = shape.text || '';
        const { width: textWidth, height: textHeight } = measureText(text, fontSize);
        
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + textWidth;
        shapeMaxY = shape.y + textHeight;
      } else {
        return;
      }

      minX = Math.min(minX, shapeMinX);
      minY = Math.min(minY, shapeMinY);
      maxX = Math.max(maxX, shapeMaxX);
      maxY = Math.max(maxY, shapeMaxY);
    });

    // Convert canvas coordinates to screen coordinates
    // Canvas coordinates need to be transformed by: (canvas * scale) + stagePos
    const screenMaxX = maxX * stageScale + stagePos.x;
    const screenMinY = minY * stageScale + stagePos.y;
    
    // Position button 10px to the right of the bounding box, 50px above it
    const buttonX = screenMaxX + 10 - 24; // 24px offset for center of 48px button
    const buttonY = screenMinY - 50;

    setFloatingAIPosition({ x: buttonX, y: buttonY });
    setShowFloatingAI(true);
  }, [selectedIds, objects, stageScale, stagePos]);

  // Update multi-select transformer nodes when selection changes
  useEffect(() => {
    const transformer = multiSelectTransformerRef.current;
    const layer = dynamicLayerRef.current;
    
    if (!transformer || !layer || selectedIds.length < 2) {
      // Clear transformer if less than 2 shapes selected
      if (transformer) {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
      return;
    }

    // Find all selected shape nodes in the layer by their name (which is set to shape.id)
    const selectedNodes: Konva.Node[] = [];
    
    selectedIds.forEach(shapeId => {
      const node = layer.findOne(`#${shapeId}`);
      if (node) {
        selectedNodes.push(node);
      }
    });

    // Attach nodes to transformer
    if (selectedNodes.length > 0) {
      transformer.nodes(selectedNodes);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  // Memoized callback to update transform (prevents frameShapes from recreating)
  const updateTransform = useCallback((position: { x: number; y: number }, scale: number) => {
    setStagePos(position);
    setStageScale(scale);
  }, []);

  // Frame shapes hook
  const { frameShapes } = useFrameShapes({
    stageRef,
    stageSize,
    onTransformUpdate: updateTransform,
  });

  // Expose frameShapes function to parent component
  useEffect(() => {
    if (onFrameShapesReady) {
      onFrameShapesReady(frameShapes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameShapes]); // Intentionally excluding onFrameShapesReady from deps

  // Notify parent of viewport changes
  useEffect(() => {
    if (onViewportChange) {
      onViewportChange(stagePos.x, stagePos.y, stageScale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagePos, stageScale]); // Intentionally excluding onViewportChange from deps

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

  // Store the latest handleMouseUp in a ref so the global event listener always uses the current version
  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  });

  // Handle global mouseup to finish selection/creation even when mouse is released outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Call the latest version of handleMouseUp from the ref
      if (handleMouseUpRef.current) {
        handleMouseUpRef.current(e as any);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []); // Empty deps - listener stays the same, but uses latest handleMouseUp via ref

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
          // Calculate accurate text size
          const { width: textWidth, height: textHeight } = measureText(obj.text || '', obj.fontSize || 16);
          
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

  // Helper function to get the center position of a shape
  const getShapeCenter = (shape: Shape): { x: number; y: number } => {
    if (isRectangle(shape)) {
      return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
    } else if (isCircle(shape)) {
      return {
        x: shape.centerX,
        y: shape.centerY,
      };
    } else if (isLine(shape)) {
      return {
        x: shape.x + (shape.width * Math.cos((shape.rotation * Math.PI) / 180)) / 2,
        y: shape.y + (shape.width * Math.sin((shape.rotation * Math.PI) / 180)) / 2,
      };
    } else if (isText(shape)) {
      const { width: textWidth, height: textHeight } = measureText(shape.text || '', shape.fontSize || 16);
      return {
        x: shape.x + textWidth / 2,
        y: shape.y + textHeight / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  // Handle deletion with poof effect
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;

    // Get positions of shapes being deleted
    const shapesToDelete = objects.filter((obj) => selectedIds.includes(obj.id));
    const newPoofEffects = shapesToDelete.map((shape) => ({
      id: `poof-${shape.id}-${Date.now()}`,
      ...getShapeCenter(shape),
    }));

    // Trigger poof effects
    setPoofEffects((prev) => [...prev, ...newPoofEffects]);

    // Delete shapes immediately
    deleteSelected();
  }, [selectedIds, objects, deleteSelected]);

  // Handle poof effect completion
  const handlePoofComplete = (id: string) => {
    setPoofEffects((prev) => prev.filter((poof) => poof.id !== id));
  };

  // Expose handleDeleteSelected function to parent component
  useEffect(() => {
    if (onDeleteWithEffectReady) {
      onDeleteWithEffectReady(handleDeleteSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDeleteSelected]); // Intentionally excluding onDeleteWithEffectReady from deps

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Special handling for spacebar: allow pan mode even in input fields, but only when held down (repeat)
      if (e.key === ' ') {
        // e.repeat is true when key is held down (not the first keypress)
        if (isInInputField && !e.repeat) {
          // First press in input field - allow typing a space
          return;
        }
        // Held down (repeat) or not in input field - trigger pan mode
        e.preventDefault();
        // Store current mode if not already in pan mode
        if (mode !== 'pan') {
          (window as any).__previousMode = mode;
          setMode('pan');
        }
        return;
      }

      // Special handling for undo/redo: apply to canvas even in input fields
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // Ctrl/Cmd + Z: Canvas Undo (override textbox undo)
        e.preventDefault();
        undo();
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        // Ctrl/Cmd + Y: Canvas Redo (override textbox redo)
        e.preventDefault();
        redo();
        return;
      }

      // Don't handle other shortcuts if typing in an input field
      if (isInInputField) {
        return;
      }

      if (e.key === 'Escape') {
        // Cancel lasso if active, otherwise clear selection
        if (lassoPath.length > 0) {
          setLassoPath([]);
        } else {
          clearSelection();
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        // Delete all selected shapes with poof effect
        e.preventDefault(); // Prevent browser back navigation on Backspace
        handleDeleteSelected();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        // Nudge selected shapes 5px in the arrow direction
        e.preventDefault(); // Prevent page scrolling
        
        const nudgeDistance = 5;
        let deltaX = 0;
        let deltaY = 0;
        
        if (e.key === 'ArrowUp') deltaY = -nudgeDistance;
        else if (e.key === 'ArrowDown') deltaY = nudgeDistance;
        else if (e.key === 'ArrowLeft') deltaX = -nudgeDistance;
        else if (e.key === 'ArrowRight') deltaX = nudgeDistance;
        
        // Capture undo snapshot before nudging
        captureUndoSnapshot('modify', selectedIds);
        
        // Batch update all selected shapes
        const updates: { [id: string]: Partial<Shape> } = {};
        
        selectedIds.forEach(id => {
          const shape = objects.find(obj => obj.id === id);
          if (!shape) return;
          
          if (isRectangle(shape) || isText(shape)) {
            updates[id] = {
              x: shape.x + deltaX,
              y: shape.y + deltaY,
            };
          } else if (isCircle(shape)) {
            updates[id] = {
              centerX: shape.centerX + deltaX,
              centerY: shape.centerY + deltaY,
            };
          } else if (isLine(shape)) {
            updates[id] = {
              x: shape.x + deltaX,
              y: shape.y + deltaY,
            };
          }
        });
        
        // Apply updates optimistically and to Firebase
        Object.entries(updates).forEach(([id, update]) => {
          updateObject(id, update);
        });
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
      } else if (e.key.toLowerCase() === 'l') {
        // Switch to Lasso mode
        setMode('lasso');
      } else if (e.key.toLowerCase() === 'r') {
        // Switch to Rectangle mode
        setMode('rectangle');
      } else if (e.key.toLowerCase() === 'c') {
        // Switch to Circle mode
        setMode('circle');
      } else if (e.key.toLowerCase() === 't') {
        // Switch to Text mode
        setMode('text');
      } else if (e.key === '/') {
        // Switch to Line mode
        setMode('line');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Restore previous mode when space is released (works everywhere, including input fields)
      if (e.key === ' ') {
        const previousMode = (window as any).__previousMode;
        if (previousMode && previousMode !== 'pan') {
          setMode(previousMode);
          (window as any).__previousMode = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [clearSelection, handleDeleteSelected, selectedIds, setMode, objects, selectMultiple, undo, redo, mode]);

  // Listen for frame-shapes event from AI operations
  useEffect(() => {
    const handleFrameShapes = (e: CustomEvent) => {
      const { shapes } = e.detail as { shapes: Shape[] };
      frameShapes(shapes, 150); // Use the hook with 150px padding
    };

    window.addEventListener('frame-shapes', handleFrameShapes as EventListener);
    return () => window.removeEventListener('frame-shapes', handleFrameShapes as EventListener);
  }, [frameShapes]);

  // Listen for export-canvas event
  useEffect(() => {
    const handleExport = () => {
      if (!stageRef.current) return;

      try {
        const stage = stageRef.current;
        const gridLayer = gridLayerRef.current;
        
        // Hide grid layer before export
        const wasGridVisible = gridLayer?.visible() ?? true;
        if (gridLayer) {
          gridLayer.visible(false);
        }
        
        // Force stage to redraw all layers
        stage.batchDraw();

        // Generate PNG data URL with high quality settings
        const dataURL = stage.toDataURL({
          pixelRatio: 2, // High quality (Retina)
          mimeType: 'image/png',
          quality: 1, // Maximum quality
        });

        // Restore grid layer visibility
        if (gridLayer) {
          gridLayer.visible(wasGridVisible);
          stage.batchDraw(); // Redraw stage to show grid again
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `CollabCanvas_${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success toast
        showSuccess('Canvas exported successfully');
      } catch (error) {
        console.error('Export failed:', error);
        showError('Export failed. Canvas may be too large.');
        
        // Make sure to restore grid visibility even on error
        const gridLayer = gridLayerRef.current;
        if (gridLayer && stageRef.current) {
          gridLayer.visible(true);
          stageRef.current.batchDraw();
        }
      }
    };

    window.addEventListener('export-canvas', handleExport);
    return () => window.removeEventListener('export-canvas', handleExport);
  }, [showSuccess, showError]);

  // Handle mouse down for panning or rectangle creation
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Reset the flag on any new mouse down
    justFinishedCreatingRef.current = false;
    
    // If clicking on empty space (stage background)
    const clickedOnEmpty = e.target === e.target.getStage();

    // Deselect when clicking on empty space (in any mode except pan), unless Shift is held
    if (clickedOnEmpty && !e.evt.shiftKey && mode !== 'pan') {
      clearSelection();
    }

    // Handle based on current mode
    if (e.evt.button === 0) {  // Left mouse button
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = screenToWorld(pos.x, pos.y);

          if (mode === 'rectangle' || mode === 'circle' || mode === 'line') {
            // Shape creation modes: Only start creating on empty space to avoid conflicts with dragging
            if (clickedOnEmpty) {
              setNewShapeStart(worldPos);
              setIsCreating(true);
            }
          } else if (mode === 'text') {
            // Text mode: Only show text modal on empty space to avoid conflicts with dragging
            if (clickedOnEmpty) {
              setTextModalPosition(worldPos);
              setTextModalValue('');
              setTextModalFontSize(16);
              setTextModalBold(false);
              setTextModalItalic(false);
              setTextModalUnderline(false);
              setTextModalColor(selectedColor); // Use toolbar's selected color
              setEditingTextId(null);
              setTextModalKey(prev => prev + 1); // Force modal remount
              setIsTextModalOpen(true);
            }
          } else if (mode === 'select' && clickedOnEmpty) {
            // Select mode: Start selection box only on empty space
            setSelectionBoxStart(worldPos);
            setSelectionBoxEnd(worldPos);
          } else if (mode === 'lasso' && clickedOnEmpty) {
            // Lasso mode: Start lasso path only on empty space
            setLassoPath([worldPos]);
          } else if (mode === 'pan' && clickedOnEmpty) {
            // Pan mode: Start panning only on empty space
            setIsPanning(true);
            wasPanningRef.current = false; // Reset flag - we haven't actually panned yet
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
        // Convert screen coordinates to world coordinates
        const worldPos = screenToWorld(pos.x, pos.y);
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
        wasPanningRef.current = true; // Mark that we actually panned (moved mouse)
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
          const worldPos = screenToWorld(pos.x, pos.y);
          setNewShapeEnd(worldPos);
        }
      }
    } else if (selectionBoxStart) {
      // Update selection box end position
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = screenToWorld(pos.x, pos.y);
          setSelectionBoxEnd(worldPos);
        }
      }
    } else if (lassoPath.length > 0 && mode === 'lasso') {
      // Append point to lasso path
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          // Convert screen coordinates to world coordinates
          const worldPos = screenToWorld(pos.x, pos.y);
          setLassoPath(prev => [...prev, worldPos]);
        }
      }
    }
  };

  // Handle mouse up to stop panning or create rectangle
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      // If we were in pan mode and just clicked (didn't actually pan), clear selection
      if (mode === 'pan' && !wasPanningRef.current) {
        clearSelection();
      }
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
          const { width: textWidth, height: textHeight } = measureText(shape.text || '', shape.fontSize || 16);
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
    } else if (lassoPath.length >= 3) {
      // Lasso selection: Select all shapes whose center is within the lasso path
      const selectedShapeIds: string[] = [];
      
      objects.forEach((shape) => {
        const center = getShapeCenter(shape);
        if (isPointInPolygon(center, lassoPath)) {
          selectedShapeIds.push(shape.id);
        }
      });
      
      // Select the shapes
      if (selectedShapeIds.length > 0) {
        selectMultiple(selectedShapeIds);
      }
      
      // Reset lasso path and auto-exit to pan mode
      setLassoPath([]);
      setMode('pan');
    } else {
      // If no drag occurred or lasso has < 3 points, just reset
      setIsCreating(false);
      setNewShapeStart(null);
      setNewShapeEnd(null);
      setSelectionBoxStart(null);
      setSelectionBoxEnd(null);
      setLassoPath([]);
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
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Vertical lines - centered at x=0
    // Calculate starting position to align grid with origin
    const startX = Math.floor(-centerX / GRID_SIZE) * GRID_SIZE;
    for (let i = startX - padding; i <= centerX + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, -centerY - padding, i, centerY + padding]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    // Horizontal lines - centered at y=0
    // Calculate starting position to align grid with origin
    const startY = Math.floor(-centerY / GRID_SIZE) * GRID_SIZE;
    for (let i = startY - padding; i <= centerY + padding; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[-centerX - padding, i, centerX + padding, i]}
          stroke="#e0e0e0"
          strokeWidth={1 / stageScale} // Keep line width consistent regardless of zoom
          listening={false}
        />
      );
    }

    // X-axis (horizontal line through y=0)
    lines.push(
      <KonvaLine
        key="x-axis"
        points={[-centerX - padding, 0, centerX + padding, 0]}
        stroke="#e0e0e0"
        strokeWidth={(3 / stageScale)} // 3x wider than grid lines
        listening={false}
      />
    );

    // Y-axis (vertical line through x=0)
    lines.push(
      <KonvaLine
        key="y-axis"
        points={[0, -centerY - padding, 0, centerY + padding]}
        stroke="#e0e0e0"
        strokeWidth={(3 / stageScale)} // 3x wider than grid lines
        listening={false}
      />
    );

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
        
        // For large selections (30+ shapes), use ref to avoid re-renders during drag
        // This keeps drag smooth at 60 FPS even with hundreds of shapes
        if (selectedIds.length > 30) {
          dragOffsetRefForRendering.current = { x: offsetX, y: offsetY };
          // Batch update the state less frequently (only if offset changed significantly)
          setMultiSelectDragOffset(prev => {
            if (prev && prev.x === offsetX && prev.y === offsetY) {
              return prev;
            }
            // Only update state every ~50ms to reduce re-renders
            return { x: offsetX, y: offsetY };
          });
        } else {
          // For smaller selections, use state normally
          setMultiSelectDragOffset(prev => {
            if (prev && prev.x === offsetX && prev.y === offsetY) {
              return prev; // No change, skip update
            }
            return { x: offsetX, y: offsetY };
          });
        }
      }
    }
  };

  // Handle drag start for multi-select
  const handleDragStart = (_id: string) => {
    if (selectedIds.length > 1) {
      // Capture undo snapshot BEFORE drag starts (shapes haven't moved yet)
      captureUndoSnapshot('modify', selectedIds);
      
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

        // Disable auto-capture during batch update (undo snapshot was captured at drag start)
        setDisableUndoCapture(true);

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
        
        // Re-enable auto-capture
        setDisableUndoCapture(false);
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      captureUndoSnapshot('modify', [id]);
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

        // Disable auto-capture during batch update (undo snapshot was captured at drag start)
        setDisableUndoCapture(true);

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
        
        // Re-enable auto-capture
        setDisableUndoCapture(false);
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      captureUndoSnapshot('modify', [id]);
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

        // Disable auto-capture during batch update (undo snapshot was captured at drag start)
        setDisableUndoCapture(true);

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
        
        // Re-enable auto-capture
        setDisableUndoCapture(false);
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select or actual transform (not drag)
      captureUndoSnapshot('modify', [id]);
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

        // Disable auto-capture during batch update (undo snapshot was captured at drag start)
        setDisableUndoCapture(true);

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
        
        // Re-enable auto-capture
        setDisableUndoCapture(false);
      }
      // Clear drag state
      setMultiSelectDragStart(null);
      setMultiSelectDragOffset(null);
    } else {
      // Single select: update this shape
      captureUndoSnapshot('modify', [id]);
      updateObject(id, { x, y });
    }
  };

  // Handle multi-select transformer transform end (scaling multiple shapes together)
  const handleMultiSelectTransformEnd = () => {
    const transformer = multiSelectTransformerRef.current;
    const layer = dynamicLayerRef.current;
    
    if (!transformer || !layer || selectedIds.length < 2) return;

    // Capture undo snapshot before making changes
    captureUndoSnapshot('modify', selectedIds);
    
    // Disable auto-capture during batch update
    setDisableUndoCapture(true);

    // Apply scale to all selected shapes
    selectedIds.forEach(shapeId => {
      const shape = objects.find(obj => obj.id === shapeId);
      if (!shape) return;

      const node = layer.findOne(`#${shapeId}`) as Konva.Node;
      if (!node) return;

      // Get the node's individual scale (applied by transformer to each node)
      const nodeScaleX = node.scaleX();
      const nodeScaleY = node.scaleY();

      // Get the node's current position
      const currentX = node.x();
      const currentY = node.y();

      // Apply scale to shape dimensions and update position
      if (isRectangle(shape)) {
        const newWidth = Math.max(5, shape.width * nodeScaleX);
        const newHeight = Math.max(5, shape.height * nodeScaleY);
        
        // Convert from center position back to top-left
        const topLeftX = currentX - newWidth / 2;
        const topLeftY = currentY - newHeight / 2;
        
        updateObject(shapeId, {
          x: topLeftX,
          y: topLeftY,
          width: newWidth,
          height: newHeight,
        });
        
        // Reset node scale
        node.scaleX(1);
        node.scaleY(1);
      } else if (isCircle(shape)) {
        // For circles, scaleX and scaleY should be the same due to keepRatio
        const newRadius = Math.max(2.5, shape.radius * nodeScaleX);
        
        updateObject(shapeId, {
          centerX: currentX,
          centerY: currentY,
          radius: newRadius,
        });
        
        // Reset node scale
        node.scaleX(1);
        node.scaleY(1);
      } else if (isLine(shape)) {
        const newWidth = Math.max(5, shape.width * nodeScaleX);
        const newStrokeWidth = Math.max(1, shape.strokeWidth * nodeScaleX);
        
        // Lines are positioned by their center, need to convert back to start point
        const rotationRad = ((shape.rotation || 0) * Math.PI) / 180;
        const centerOffsetX = (newWidth / 2) * Math.cos(rotationRad);
        const centerOffsetY = (newWidth / 2) * Math.sin(rotationRad);
        const startX = currentX - centerOffsetX;
        const startY = currentY - centerOffsetY;
        
        updateObject(shapeId, {
          x: startX,
          y: startY,
          width: newWidth,
          strokeWidth: newStrokeWidth,
        });
        
        // Reset node scale
        node.scaleX(1);
        node.scaleY(1);
      } else if (isText(shape)) {
        const newFontSize = Math.max(8, (shape.fontSize || 16) * nodeScaleX);
        
        // Text is positioned differently, we need to get the text dimensions
        const textNode = node as Konva.Text;
        const textWidth = textNode.width() * nodeScaleX;
        const textHeight = textNode.height() * nodeScaleY;
        
        // Convert from center position back to top-left
        const topLeftX = currentX - textWidth / 2;
        const topLeftY = currentY - textHeight / 2;
        
        updateObject(shapeId, {
          x: topLeftX,
          y: topLeftY,
          fontSize: newFontSize,
        });
        
        // Reset node scale
        node.scaleX(1);
        node.scaleY(1);
      }
    });

    // Re-enable auto-capture
    setDisableUndoCapture(false);

    // Force layer redraw
    layer.batchDraw();
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
      if (selectedIds.length === 1 && selectedIds.includes(id) && !shiftKey) {
        // If it's the ONLY selected item and not shift-clicking, open edit modal
        setEditingTextId(id);
        setTextModalValue(textObject.text);
        setTextModalFontSize(textObject.fontSize || 16);
        setTextModalBold(textObject.bold || false);
        setTextModalItalic(textObject.italic || false);
        setTextModalUnderline(textObject.underline || false);
        setTextModalColor(textObject.fill || '#000000'); // Use text's current color
        setIsTextModalOpen(true);
      } else {
        // If not the only selected item, or shift-clicking, just select it
        selectObject(id, shiftKey);
      }
    }
  };


  // Handle opening text edit modal for a specific text shape
  const handleTextEditStart = (id: string) => {
    const textObject = objects.find(obj => obj.id === id && isText(obj));
    if (textObject && isText(textObject)) {
      setEditingTextId(id);
      setTextModalValue(textObject.text);
      setTextModalFontSize(textObject.fontSize || 16);
      setTextModalBold(textObject.bold || false);
      setTextModalItalic(textObject.italic || false);
      setTextModalUnderline(textObject.underline || false);
      setTextModalColor(textObject.fill || '#000000');
      setIsTextModalOpen(true);
    }
  };

  // Handle text modal save
  const handleTextModalSave = (text: string, fontSize: number, bold: boolean, italic: boolean, underline: boolean, color: string) => {
    if (editingTextId) {
      // Editing existing text
      updateObject(editingTextId, { text, fontSize, bold, italic, underline, fill: color });
    } else if (authContext?.user) {
      // Creating new text
      createObject({
        type: 'text',
        x: textModalPosition.x,
        y: textModalPosition.y,
        text,
        fontSize,
        fill: color,
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
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 canvas-container" style={{ marginTop: '64px' }}>
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
        onWheel={handleWheel}
        style={{ 
          cursor: isPanning 
            ? 'grabbing' 
            : isCreating 
            ? 'crosshair' 
            : mode === 'pan'
            ? 'grab'
            : mode === 'select'
            ? 'default'
            : mode === 'lasso'
            ? 'crosshair'
            : 'crosshair'
        }}
      >
        {/* Grid layer */}
        <Layer ref={gridLayerRef} listening={false}>
          {/* Hide grid during large multi-select drag for better performance */}
          {!(selectedIds.length > 100 && multiSelectDragStart) && generateGridLines()}
        </Layer>

        {/* Static layer - cached unselected shapes */}
        <Layer ref={staticLayerRef}>
          {staticObjects.map((shape) => {
            // Simplified rendering with click and hover handlers
            const handleMouseEnter = (e: any) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'pointer';
              }
            };

            const handleMouseLeave = (e: any) => {
              const container = e.target.getStage()?.container();
              if (container) {
                if (mode === 'pan') {
                  container.style.cursor = 'grab';
                } else if (mode === 'select') {
                  container.style.cursor = 'default';
                } else {
                  container.style.cursor = 'crosshair';
                }
              }
            };

            if (isRectangle(shape)) {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x + shape.width / 2}
                  y={shape.y + shape.height / 2}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  rotation={shape.rotation || 0}
                  offsetX={shape.width / 2}
                  offsetY={shape.height / 2}
                  onClick={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onTap={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  perfectDrawEnabled={false}
                />
              );
            } else if (isCircle(shape)) {
              return (
                <KonvaCircle
                  key={shape.id}
                  x={shape.centerX}
                  y={shape.centerY}
                  radius={shape.radius}
                  fill={shape.fill}
                  rotation={shape.rotation || 0}
                  onClick={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onTap={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  perfectDrawEnabled={false}
                />
              );
            } else if (isLine(shape)) {
              const dx = shape.width * Math.cos((shape.rotation * Math.PI) / 180);
              const dy = shape.width * Math.sin((shape.rotation * Math.PI) / 180);
              return (
                <KonvaLine
                  key={shape.id}
                  points={[shape.x, shape.y, shape.x + dx, shape.y + dy]}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  onClick={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onTap={(e) => handleShapeClick(shape.id, (e.evt as MouseEvent).shiftKey)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  perfectDrawEnabled={false}
                />
              );
            } else if (isText(shape)) {
              return (
                <Text
                  key={shape.id}
                  text={shape}
                  isSelected={false}
                  onClick={handleTextClick}
                  onDragStart={() => {}}
                  onDragMove={() => {}}
                  onDragEnd={() => {}}
                  onTransform={() => {}}
                  mode={mode}
                />
              );
            }
            return null;
          })}
        </Layer>

        {/* Objects layer (or dynamic layer in performance mode) */}
        <Layer ref={dynamicLayerRef}>
          {/* Unselected shapes are rendered in the static performance layer above */}
          {null}

          {/* Render selected shapes last (transformers will be on top) */}
          {(dynamicObjects).map((shape) => {
            // Optimize for performance: disable expensive visual features when 2+ shapes selected
            const isMultiSelect = selectedIds.length >= 2;
            const showTransformer = selectedIds.length === 1;
            // When multiple shapes selected, render without individual selection indicators (use bounding box instead)
            const showSelectionIndicators = !isMultiSelect;
            
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
                  isDraggable={true}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleRectangleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                  showSelectionIndicators={showSelectionIndicators}
                  isMultiSelect={isMultiSelect}
                />
              );
            } else if (isCircle(adjustedShape)) {
              return (
                <Circle
                  key={shape.id}
                  circle={adjustedShape}
                  isSelected={true}
                  isDraggable={true}
                  onClick={handleShapeClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleRectangleDragMove}
                  onDragEnd={handleCircleDragEnd}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                  showSelectionIndicators={showSelectionIndicators}
                  isMultiSelect={isMultiSelect}
                />
              );
            } else if (isLine(adjustedShape)) {
              return (
                <Line
                  key={shape.id}
                  line={adjustedShape}
                  isSelected={true}
                  isDraggable={true}
                  onClick={(id, shiftKey) => handleShapeClick(id, shiftKey)}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                  isMultiSelect={isMultiSelect}
                />
              );
            } else if (isText(adjustedShape)) {
              return (
                <Text
                  key={shape.id}
                  text={adjustedShape}
                  isSelected={true}
                  isDraggable={true}
                  onClick={handleTextClick}
                  onDragStart={handleDragStart}
                  onDragMove={(id, x, y) => handleRectangleDragMove(id, x, y)}
                  onDragEnd={(id, x, y) => handleTextDragEnd(id, x, y)}
                  onTransform={handleShapeTransform}
                  mode={mode}
                  showTransformer={showTransformer}
                  onEditStart={handleTextEditStart}
                  showSelectionIndicators={showSelectionIndicators}
                  isMultiSelect={isMultiSelect}
                />
              );
            }
            return null;
          })}

          {/* Multi-select transformer (for scaling multiple shapes together) */}
          {selectedIds.length >= 2 && (
            <Transformer
              ref={multiSelectTransformerRef}
              borderEnabled={true}
              borderStroke="#3B82F6"
              borderStrokeWidth={2}
              anchorSize={8}
              anchorStroke="#3B82F6"
              anchorFill="#ffffff"
              anchorCornerRadius={2}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              rotateEnabled={false}
              keepRatio={true}
              boundBoxFunc={(oldBox, newBox) => {
                // Enforce minimum size of 5px
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              onTransformEnd={handleMultiSelectTransformEnd}
            />
          )}

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

          {/* Lasso path */}
          {lassoPath.length > 0 && (
            <KonvaLine
              points={lassoPath.flatMap(p => [p.x, p.y])}
              stroke="#3B82F6"
              strokeWidth={2}
              dash={[5, 5]}
              closed={lassoPath.length >= 3}
              listening={false}
            />
          )}
        </Layer>

        {/* Poof effects layer (on top of everything) */}
        <Layer listening={false}>
          {poofEffects.map((poof) => (
            <PoofEffect
              key={poof.id}
              x={poof.x}
              y={poof.y}
              scale={stageScale}
              onComplete={() => handlePoofComplete(poof.id)}
            />
          ))}
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
              scale={stageScale}
            />
          ))}
        </Layer>
      </Stage>

      {/* Floating AI Assistant button */}
      {showFloatingAI && floatingAIPosition && (
        <button
          onClick={() => {
            // Dispatch event to open AI Assistant panel with context about selected shapes
            window.dispatchEvent(new CustomEvent('openAIAssistant', {
              detail: { selectedShapeIds: selectedIds }
            }));
          }}
          className="fixed z-50 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          style={{
            left: `${floatingAIPosition.x}px`,
            top: `${floatingAIPosition.y}px`,
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Ask AI about selected shapes"
        >
          <Sparkles size={24} className="text-white" />
        </button>
      )}

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
              <span className="font-semibold">Objects:</span>{' '}
              <span className={`px-2 py-0.5 rounded ${
                objects.length >= MAX_CANVAS_OBJECTS * 0.9 
                  ? 'bg-red-100 text-red-700' 
                  : objects.length >= MAX_CANVAS_OBJECTS * 0.7 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {objects.length}/{MAX_CANVAS_OBJECTS}
              </span>
            </div>
            {selectedIds.length > 0 && (
              <>
                <div className="border-t border-gray-300 mt-1 pt-1">
                  <div className="text-green-700 font-semibold mb-1">
                    Selected Objects: {selectedIds.length}
                  </div>
                  <div className="text-xs text-gray-700 space-y-0.5">
                    {(() => {
                      const selectedShapes = objects.filter(obj => selectedIds.includes(obj.id));
                      const shapeTypeCounts: Record<string, number> = {};
                      selectedShapes.forEach(shape => {
                        shapeTypeCounts[shape.type] = (shapeTypeCounts[shape.type] || 0) + 1;
                      });
                      return Object.entries(shapeTypeCounts).map(([type, count]) => (
                        <div key={type}>
                          {count} {type}{count > 1 ? 's' : ''}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            )}
            <div className="border-t border-gray-300 mt-1 pt-1">
              <span className="font-semibold text-xs">Viewport Bounds:</span>
              <div className="text-xs text-gray-700 font-mono mt-0.5">
                x: {Math.round((-stagePos.x) / stageScale)} → {Math.round((-stagePos.x + window.innerWidth) / stageScale)}
              </div>
              <div className="text-xs text-gray-700 font-mono">
                y: {Math.round((-stagePos.y) / stageScale)} → {Math.round((-stagePos.y + window.innerHeight) / stageScale)}
              </div>
            </div>
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
        initialColor={textModalColor}
        onSave={handleTextModalSave}
        onCancel={handleTextModalCancel}
      />
    </div>
  );
}

