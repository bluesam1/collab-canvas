/**
 * AI Tool Executor - Client-side
 * Executes OpenAI function calls by creating/modifying shapes on the canvas
 */

import type { ToolCall } from '../types/ai';
import type { CanvasContextType } from '../types';
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
      // Continue with other tool calls even if one fails
    }
  }

  return affectedShapeIds;
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

      if (count === 1) {
        // Single shape - create at exact position
        const id = await createObject({
          type: 'rectangle',
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          fill: args.color,
          rotation: 0,
          createdBy: userId,
        });
        return id ? [id] : [];
      }

      // Multiple shapes - arrange in grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = args.width + spacing;
      const cellHeight = args.height + spacing;
      
      // Center the grid around the specified position
      const gridWidth = cols * cellWidth - spacing;
      const gridHeight = rows * cellHeight - spacing;
      const startX = args.x - gridWidth / 2;
      const startY = args.y - gridHeight / 2;

      // Use colors array if provided, otherwise use single color
      const colors = args.colors || [args.color];

      // Prepare all shapes in memory
      const shapesData = [];
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * cellWidth;
        const y = startY + row * cellHeight;
        const color = colors[i % colors.length]; // Cycle through colors

        shapesData.push({
          type: 'rectangle' as const,
          x,
          y,
          width: args.width,
          height: args.height,
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

      if (count === 1) {
        // Single shape - create at exact position
        const id = await createObject({
          type: 'circle',
          centerX: args.x,
          centerY: args.y,
          radius: args.radius,
          fill: args.color,
          rotation: 0,
          createdBy: userId,
        });
        return id ? [id] : [];
      }

      // Multiple shapes - arrange in grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = args.radius * 2 + spacing;
      const cellHeight = args.radius * 2 + spacing;
      
      // Center the grid around the specified position
      const gridWidth = cols * cellWidth - spacing;
      const gridHeight = rows * cellHeight - spacing;
      const startX = args.x - gridWidth / 2 + args.radius;
      const startY = args.y - gridHeight / 2 + args.radius;

      // Use colors array if provided, otherwise use single color
      const colors = args.colors || [args.color];

      // Prepare all shapes in memory
      const shapesData = [];
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const centerX = startX + col * cellWidth;
        const centerY = startY + row * cellHeight;
        const color = colors[i % colors.length]; // Cycle through colors

        shapesData.push({
          type: 'circle' as const,
          centerX,
          centerY,
          radius: args.radius,
          fill: color,
          rotation: 0,
          createdBy: userId,
        });
      }

      // Create all shapes in a single batch (1 state update, 1 Firebase write)
      return await createObjectsBatch(shapesData);
    }

    case 'createLine': {
      // Convert x1,y1,x2,y2 to x,y,width,rotation format
      const dx = args.x2 - args.x1;
      const dy = args.y2 - args.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const id = await createObject({
        type: 'line',
        x: args.x1,
        y: args.y1,
        width: length,
        height: 0,
        stroke: args.color,
        strokeWidth: args.strokeWidth,
        rotation: angle,
        createdBy: userId,
      });
      return id ? [id] : [];
    }

    case 'createText': {
      const id = await createObject({
        type: 'text',
        x: args.x,
        y: args.y,
        text: args.text,
        fontSize: args.fontSize,
        fill: args.color,
        rotation: 0,
        createdBy: userId,
      });
      return id ? [id] : [];
    }

    // ===== MANIPULATION TOOLS =====
    case 'moveShapes': {
      const shapeIds = args.shapeIds as string[];
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (args.relative) {
            // Relative movement
            if (isCircle(shape)) {
              await updateObject(id, {
                centerX: shape.centerX + args.x,
                centerY: shape.centerY + args.y,
              });
            } else {
              // Rectangle, Line, Text all use x/y
              await updateObject(id, {
                x: shape.x + args.x,
                y: shape.y + args.y,
              });
            }
          } else {
            // Absolute movement
            if (isCircle(shape)) {
              await updateObject(id, {
                centerX: args.x,
                centerY: args.y,
              });
            } else {
              await updateObject(id, {
                x: args.x,
                y: args.y,
              });
            }
          }
        }
      }
      return shapeIds;
    }

    case 'resizeShapes': {
      const shapeIds = args.shapeIds as string[];
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (isRectangle(shape)) {
            await updateObject(id, {
              width: shape.width * args.scaleFactor,
              height: shape.height * args.scaleFactor,
            });
          } else if (isCircle(shape)) {
            await updateObject(id, {
              radius: shape.radius * args.scaleFactor,
            });
          } else if (isLine(shape)) {
            await updateObject(id, {
              width: shape.width * args.scaleFactor,
            });
          }
        }
      }
      return shapeIds;
    }

    case 'rotateShapes': {
      const shapeIds = args.shapeIds as string[];
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          // All shapes support rotation
          await updateObject(id, {
            rotation: args.degrees,
          });
        }
      }
      return shapeIds;
    }

    case 'changeColor': {
      const shapeIds = args.shapeIds as string[];
      for (const id of shapeIds) {
        const shape = objects.find((obj) => obj.id === id);
        if (shape) {
          if (isLine(shape)) {
            await updateObject(id, { stroke: args.color });
          } else {
            await updateObject(id, { fill: args.color });
          }
        }
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
      
      if (shapes.length < 3) return shapeIds; // Need at least 3 shapes to distribute

      const direction = args.direction as string;
      
      if (direction === 'horizontal') {
        shapes.sort((a, b) => {
          const aX = isCircle(a) ? a.centerX : (isRectangle(a) || isLine(a) ? a.x : a.x);
          const bX = isCircle(b) ? b.centerX : (isRectangle(b) || isLine(b) ? b.x : b.x);
          return aX - bX;
        });
        const firstShape = shapes[0];
        const lastShape = shapes[shapes.length - 1];
        const minX = isCircle(firstShape) ? firstShape.centerX : (isRectangle(firstShape) || isLine(firstShape) ? firstShape.x : firstShape.x);
        const maxX = isCircle(lastShape) ? lastShape.centerX : (isRectangle(lastShape) || isLine(lastShape) ? lastShape.x : lastShape.x);
        const spacing = (maxX - minX) / (shapes.length - 1);
        
        for (let i = 0; i < shapes.length; i++) {
          const newX = minX + i * spacing;
          if (isCircle(shapes[i])) {
            await updateObject(shapes[i].id, { centerX: newX });
          } else {
            await updateObject(shapes[i].id, { x: newX });
          }
        }
      } else if (direction === 'vertical') {
        shapes.sort((a, b) => {
          const aY = isCircle(a) ? a.centerY : (isRectangle(a) || isLine(a) ? a.y : a.y);
          const bY = isCircle(b) ? b.centerY : (isRectangle(b) || isLine(b) ? b.y : b.y);
          return aY - bY;
        });
        const firstShape = shapes[0];
        const lastShape = shapes[shapes.length - 1];
        const minY = isCircle(firstShape) ? firstShape.centerY : (isRectangle(firstShape) || isLine(firstShape) ? firstShape.y : firstShape.y);
        const maxY = isCircle(lastShape) ? lastShape.centerY : (isRectangle(lastShape) || isLine(lastShape) ? lastShape.y : lastShape.y);
        const spacing = (maxY - minY) / (shapes.length - 1);
        
        for (let i = 0; i < shapes.length; i++) {
          const newY = minY + i * spacing;
          if (isCircle(shapes[i])) {
            await updateObject(shapes[i].id, { centerY: newY });
          } else {
            await updateObject(shapes[i].id, { y: newY });
          }
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
