/**
 * AI Tool Executor - Client-side
 * Executes OpenAI function calls by creating/modifying shapes on the canvas
 */

import type { ToolCall } from '../types/ai';
import type { CanvasContextType, Shape } from '../types';
import { MAX_CANVAS_OBJECTS, CANVAS_LIMITS } from '../constants/canvas';
import { isRectangle, isCircle, isLine } from '../types';

/**
 * Execute all tool calls from OpenAI response
 * Returns array of affected shape IDs for auto-selection
 */
export const executeToolCalls = async (
  toolCalls: ToolCall[],
  canvasContext: CanvasContextType,
  userId: string
): Promise<string[]> => {
  const affectedShapeIds: string[] = [];

  for (const toolCall of toolCalls) {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const shapeIds = await executeToolCall(
        toolCall.function.name,
        args,
        canvasContext,
        userId
      );
      affectedShapeIds.push(...shapeIds);
    } catch (error) {
      console.error('Error executing tool call:', toolCall.function.name, error);
      // Re-throw canvas limit errors so they can be shown to the user
      if (error instanceof Error && error.message.includes('Canvas limit')) {
        throw error;
      }
      // Continue with other tool calls for non-limit errors
    }
  }

  // Remove duplicates and return unique affected shape IDs
  return [...new Set(affectedShapeIds)];
};

/**
 * Execute a single tool call
 */
async function executeToolCall(
  toolName: string,
  args: any,
  canvasContext: CanvasContextType,
  userId: string
): Promise<string[]> {
  const { createObject, createObjectsBatch, updateObject, deleteObject, objects } = canvasContext;

  switch (toolName) {
    // ===== CREATION TOOLS =====
    case 'createRectangle': {
      const count = args.count || 1;
      const spacing = args.spacing || 20;

      // Check canvas object limit
      if (objects.length >= MAX_CANVAS_OBJECTS) {
        throw new Error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      }

      // Check if batch creation would exceed limit
      if (objects.length + count > MAX_CANVAS_OBJECTS) {
        const maxAllowed = MAX_CANVAS_OBJECTS - objects.length;
        throw new Error(`Cannot create ${count} rectangle${count !== 1 ? 's' : ''}. Only ${maxAllowed} slot${maxAllowed !== 1 ? 's' : ''} remaining. Canvas limit: ${MAX_CANVAS_OBJECTS} objects. Please delete some objects before creating more.`);
      }

      // Validate coordinates and dimensions to prevent NaN values
      const x = typeof args.x === 'number' && !isNaN(args.x) ? args.x : 0;
      const y = typeof args.y === 'number' && !isNaN(args.y) ? args.y : 0;
      const width = typeof args.width === 'number' && !isNaN(args.width) && args.width > 0 ? args.width : 100;
      const height = typeof args.height === 'number' && !isNaN(args.height) && args.height > 0 ? args.height : 100;

      if (count === 1) {
        // Single shape - create at exact position
        const id = await createObject({
          type: 'rectangle',
          x: x,
          y: y,
          width: width,
          height: height,
          fill: args.color || '#3B82F6',
          rotation: 0,
          createdBy: userId,
        });
        return id ? [id] : [];
      }

      // Multiple shapes - arrange in grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = width + spacing;
      const cellHeight = height + spacing;
      
      // Center the grid around the specified position
      const gridWidth = cols * cellWidth - spacing;
      const gridHeight = rows * cellHeight - spacing;
      const startX = x - gridWidth / 2;
      const startY = y - gridHeight / 2;

      // Use colors array if provided, otherwise use single color
      const colors = args.colors || [args.color];

      // Prepare all shapes in memory
      const shapesData = [];
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * cellWidth;
        const y = startY + row * cellHeight;
        
        // For random colors, pick randomly from the colors array
        const color = colors.length > 1 
          ? colors[Math.floor(Math.random() * colors.length)]
          : colors[0];

        shapesData.push({
          type: 'rectangle' as const,
          x,
          y,
          width: width,
          height: height,
          fill: color,
          rotation: 0,
          createdBy: userId,
        });
      }

      // Create all shapes in a single batch (1 state update, 1 Firebase write)
      return await createObjectsBatch(shapesData);
    }

    case 'createCircle': {
      const count = args.count || 1;
      const spacing = args.spacing || 20;

      // Check canvas object limit
      if (objects.length >= MAX_CANVAS_OBJECTS) {
        throw new Error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      }

      // Check if batch creation would exceed limit
      if (objects.length + count > MAX_CANVAS_OBJECTS) {
        const maxAllowed = MAX_CANVAS_OBJECTS - objects.length;
        throw new Error(`Cannot create ${count} circle${count !== 1 ? 's' : ''}. Only ${maxAllowed} slot${maxAllowed !== 1 ? 's' : ''} remaining. Canvas limit: ${MAX_CANVAS_OBJECTS} objects. Please delete some objects before creating more.`);
      }

      // Validate coordinates to prevent NaN values
      const x = typeof args.x === 'number' && !isNaN(args.x) ? args.x : 0;
      const y = typeof args.y === 'number' && !isNaN(args.y) ? args.y : 0;
      const radius = typeof args.radius === 'number' && !isNaN(args.radius) && args.radius > 0 ? args.radius : 50;

      if (count === 1) {
        // Single shape - create at exact position
        const id = await createObject({
          type: 'circle',
          centerX: x,
          centerY: y,
          radius: radius,
          fill: args.color || '#3B82F6',
          rotation: 0,
          createdBy: userId,
        });
        return id ? [id] : [];
      }

      // Multiple shapes - arrange in grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = radius * 2 + spacing;
      const cellHeight = radius * 2 + spacing;
      
      // Center the grid around the specified position
      const gridWidth = cols * cellWidth - spacing;
      const gridHeight = rows * cellHeight - spacing;
      const startX = x - gridWidth / 2 + radius;
      const startY = y - gridHeight / 2 + radius;

      // Use colors array if provided, otherwise use single color
      const colors = args.colors || [args.color];

      // Prepare all shapes in memory
      const shapesData = [];
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const centerX = startX + col * cellWidth;
        const centerY = startY + row * cellHeight;
        
        // For random colors, pick randomly from the colors array
        const color = colors.length > 1 
          ? colors[Math.floor(Math.random() * colors.length)]
          : colors[0];

        shapesData.push({
          type: 'circle' as const,
          centerX,
          centerY,
          radius: radius,
          fill: color,
          rotation: 0,
          createdBy: userId,
        });
      }

      // Create all shapes in a single batch (1 state update, 1 Firebase write)
      return await createObjectsBatch(shapesData);
    }

    case 'createLine': {
      // Check canvas object limit
      if (objects.length >= MAX_CANVAS_OBJECTS) {
        throw new Error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      }

      // Validate coordinates to prevent NaN values
      const x1 = typeof args.x1 === 'number' && !isNaN(args.x1) ? args.x1 : 0;
      const y1 = typeof args.y1 === 'number' && !isNaN(args.y1) ? args.y1 : 0;
      const x2 = typeof args.x2 === 'number' && !isNaN(args.x2) ? args.x2 : 100;
      const y2 = typeof args.y2 === 'number' && !isNaN(args.y2) ? args.y2 : 0;
      const strokeWidth = typeof args.strokeWidth === 'number' && !isNaN(args.strokeWidth) && args.strokeWidth > 0 ? args.strokeWidth : 2;

      // Convert x1,y1,x2,y2 to x,y,width,rotation format
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const id = await createObject({
        type: 'line',
        x: x1,
        y: y1,
        width: length,
        height: 0,
        stroke: args.color || '#3B82F6',
        strokeWidth: strokeWidth,
        rotation: angle,
        createdBy: userId,
      });
      return id ? [id] : [];
    }

    case 'createText': {
      // Check canvas object limit
      if (objects.length >= MAX_CANVAS_OBJECTS) {
        throw new Error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      }

      // Validate coordinates and text properties to prevent NaN values
      const x = typeof args.x === 'number' && !isNaN(args.x) ? args.x : 0;
      const y = typeof args.y === 'number' && !isNaN(args.y) ? args.y : 0;
      const fontSize = typeof args.fontSize === 'number' && !isNaN(args.fontSize) && args.fontSize > 0 ? args.fontSize : 16;
      const text = typeof args.text === 'string' && args.text.trim() ? args.text.trim() : 'Text';

      const id = await createObject({
        type: 'text',
        x: x,
        y: y,
        text: text,
        fontSize: fontSize,
        fill: args.color || '#3B82F6',
        rotation: 0,
        createdBy: userId,
      });
      return id ? [id] : [];
    }

    // ===== MANIPULATION TOOLS =====
    case 'moveShapes': {
      const shapeIds = args.shapeIds as string[];
      const updatesMap = new Map<string, Partial<Shape>>();
      
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (args.relative) {
            // Relative movement
            if (isCircle(shape)) {
              updatesMap.set(id, {
                centerX: shape.centerX + args.x,
                centerY: shape.centerY + args.y,
              });
            } else {
              // Rectangle, Line, Text all use x/y
              updatesMap.set(id, {
                x: shape.x + args.x,
                y: shape.y + args.y,
              });
            }
          } else {
            // Absolute movement
            if (isCircle(shape)) {
              updatesMap.set(id, {
                centerX: args.x,
                centerY: args.y,
              });
            } else {
              updatesMap.set(id, {
                x: args.x,
                y: args.y,
              });
            }
          }
        }
      }
      
      if (updatesMap.size > 0) {
        await canvasContext.updateObjectsBatch(updatesMap);
      }
      return shapeIds;
    }

    case 'resizeShapes': {
      const shapeIds = args.shapeIds as string[];
      const updatesMap = new Map<string, Partial<Shape>>();
      
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (isRectangle(shape)) {
            updatesMap.set(id, {
              width: shape.width * args.scaleFactor,
              height: shape.height * args.scaleFactor,
            });
          } else if (isCircle(shape)) {
            updatesMap.set(id, {
              radius: shape.radius * args.scaleFactor,
            });
          } else if (isLine(shape)) {
            updatesMap.set(id, {
              width: shape.width * args.scaleFactor,
            });
          }
        }
      }
      
      if (updatesMap.size > 0) {
        await canvasContext.updateObjectsBatch(updatesMap);
      }
      return shapeIds;
    }

    case 'rotateShapes': {
      const shapeIds = args.shapeIds as string[];
      const updatesMap = new Map<string, Partial<Shape>>();
      
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          // All shapes support rotation
          updatesMap.set(id, {
            rotation: args.degrees,
          });
        }
      }
      
      if (updatesMap.size > 0) {
        await canvasContext.updateObjectsBatch(updatesMap);
      }
      return shapeIds;
    }

    case 'changeColor': {
      const shapeIds = args.shapeIds as string[];
      const updatesMap = new Map<string, Partial<Shape>>();
      
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (isLine(shape)) {
            updatesMap.set(id, { stroke: args.color });
          } else {
            updatesMap.set(id, { fill: args.color });
          }
        }
      }
      
      if (updatesMap.size > 0) {
        await canvasContext.updateObjectsBatch(updatesMap);
      }
      return shapeIds;
    }

    case 'modifyText': {
      const shapeIds = args.shapeIds as string[];
      const updatesMap = new Map<string, Partial<Shape>>();
      
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        
        if (shape && shape.type === 'text') {
          const updateData: any = {};
          
          // Update fontSize if provided
          if (args.fontSize !== undefined) {
            updateData.fontSize = args.fontSize;
          }
          
          // Update text content if provided
          if (args.text !== undefined) {
            updateData.text = args.text;
          }
          
          // Update color if provided
          if (args.color !== undefined) {
            updateData.fill = args.color;
          }
          
          // Only add to batch if there are changes
          if (Object.keys(updateData).length > 0) {
            updatesMap.set(id, updateData);
          }
        }
      }
      
      if (updatesMap.size > 0) {
        await canvasContext.updateObjectsBatch(updatesMap);
      }
      return shapeIds;
    }

    case 'deleteShapes': {
      const shapeIds = args.shapeIds as string[];
      // Batch delete - much more efficient than looping
      await deleteObject(shapeIds);
      // Return the deleted IDs to show that something happened
      // (even though we won't select them since they're deleted)
      return shapeIds;
    }

    // ===== LAYOUT TOOLS =====
    case 'arrangeInGrid': {
      const shapeIds = (args.shapeIds as string[]).length > 0 
        ? args.shapeIds 
        : objects.map((obj) => obj.id);
      
      const { rows, cols, spacingX, spacingY } = args;
      let index = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (index >= shapeIds.length) break;
          const id = shapeIds[index];
          const shape = objects.find((obj) => obj.id === id);
          if (shape) {
            if (isCircle(shape)) {
              await updateObject(id, {
                centerX: col * spacingX,
                centerY: row * spacingY,
              });
            } else {
              await updateObject(id, {
                x: col * spacingX,
                y: row * spacingY,
              });
            }
          }
          index++;
        }
      }
      return shapeIds;
    }

    case 'alignShapes': {
      const shapeIds = args.shapeIds as string[];
      const shapes = objects.filter((obj) => shapeIds.includes(obj.id));
      
      if (shapes.length === 0) return [];

      const alignment = args.alignment as string;
      
      if (alignment === 'left') {
        const minX = Math.min(...shapes.map((s) => isCircle(s) ? s.centerX : s.x));
        for (const shape of shapes) {
          if (isCircle(shape)) {
            await updateObject(shape.id, { centerX: minX });
          } else {
            await updateObject(shape.id, { x: minX });
          }
        }
      } else if (alignment === 'right') {
        const maxX = Math.max(...shapes.map((s) => isCircle(s) ? s.centerX : s.x));
        for (const shape of shapes) {
          if (isCircle(shape)) {
            await updateObject(shape.id, { centerX: maxX });
          } else {
            await updateObject(shape.id, { x: maxX });
          }
        }
      } else if (alignment === 'center') {
        const avgX = shapes.reduce((sum, s) => sum + (isCircle(s) ? s.centerX : s.x), 0) / shapes.length;
        for (const shape of shapes) {
          if (isCircle(shape)) {
            await updateObject(shape.id, { centerX: avgX });
          } else {
            await updateObject(shape.id, { x: avgX });
          }
        }
      } else if (alignment === 'top') {
        const minY = Math.min(...shapes.map((s) => isCircle(s) ? s.centerY : s.y));
        for (const shape of shapes) {
          if (isCircle(shape)) {
            await updateObject(shape.id, { centerY: minY });
          } else {
            await updateObject(shape.id, { y: minY });
          }
        }
      } else if (alignment === 'bottom') {
        const maxY = Math.max(...shapes.map((s) => isCircle(s) ? s.centerY : s.y));
        for (const shape of shapes) {
          if (isCircle(shape)) {
            await updateObject(shape.id, { centerY: maxY });
          } else {
            await updateObject(shape.id, { y: maxY });
          }
        }
      }
      
      return shapeIds;
    }

    case 'distributeShapes': {
      const shapeIds = args.shapeIds as string[];
      const shapes = objects.filter((obj) => shapeIds.includes(obj.id));
      
      if (shapes.length < 3) {
        return shapeIds; // Need at least 3 shapes to distribute
      }

      const direction = args.direction as string;
      
      if (direction === 'horizontal') {
        shapes.sort((a, b) => {
          const aX = isCircle(a) ? a.centerX : (a as any).x;
          const bX = isCircle(b) ? b.centerX : (b as any).x;
          return aX - bX;
        });
        const firstShape = shapes[0];
        const lastShape = shapes[shapes.length - 1];
        const minX = isCircle(firstShape) ? firstShape.centerX : (firstShape as any).x;
        const maxX = isCircle(lastShape) ? lastShape.centerX : (lastShape as any).x;
        const spacing = (maxX - minX) / (shapes.length - 1);
        
        let hasChanges = false;
        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];
          const currentX = isCircle(shape) ? shape.centerX : (shape as any).x;
          const newX = minX + i * spacing;
          
          // Only update if position actually changes
          if (Math.abs(currentX - newX) > 0.1) {
            if (isCircle(shape)) {
              await updateObject(shape.id, { centerX: newX });
            } else {
              await updateObject(shape.id, { x: newX });
            }
            hasChanges = true;
          }
        }
        
        if (!hasChanges) {
          // All shapes already evenly distributed - no changes needed
        }
      } else if (direction === 'vertical') {
        shapes.sort((a, b) => {
          const aY = isCircle(a) ? a.centerY : (a as any).y;
          const bY = isCircle(b) ? b.centerY : (b as any).y;
          return aY - bY;
        });
        const firstShape = shapes[0];
        const lastShape = shapes[shapes.length - 1];
        const minY = isCircle(firstShape) ? firstShape.centerY : (firstShape as any).y;
        const maxY = isCircle(lastShape) ? lastShape.centerY : (lastShape as any).y;
        const spacing = (maxY - minY) / (shapes.length - 1);
        
        let hasChanges = false;
        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];
          const currentY = isCircle(shape) ? shape.centerY : (shape as any).y;
          const newY = minY + i * spacing;
          
          // Only update if position actually changes
          if (Math.abs(currentY - newY) > 0.1) {
            console.log(`🔄 Moving shape ${shape.id}: ${currentY} -> ${newY}`);
            if (isCircle(shape)) {
              await updateObject(shape.id, { centerY: newY });
            } else {
              await updateObject(shape.id, { y: newY });
            }
            hasChanges = true;
          } else {
            console.log(`✅ Shape ${shape.id} already in correct position: ${currentY}`);
          }
        }
        
        if (!hasChanges) {
          // All shapes already evenly distributed - no changes needed
        }
      }
      
      return shapeIds;
    }

    // ===== CONTEXT & QUERY TOOLS =====
    case 'getCanvasState': {
      // This tool is used by OpenAI to understand the canvas
      // No client-side action needed
      return [];
    }

    case 'selectShapes': {
      // Selection is handled separately
      return args.shapeIds as string[];
    }

    default:
      console.warn('Unknown tool:', toolName);
      return [];
  }
}
