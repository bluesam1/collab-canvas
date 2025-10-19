/**
 * AI Agent Executor
 * Handles OpenAI API calls with function calling
 * Refactored to use core.ts for testability
 */

import {validateOpenAIConfig} from "./openai";
import {getAIToolCalls} from "./core";
import type {
  ProcessAICommandRequest,
  ProcessAICommandResponse,
} from "../types/ai";
import * as logger from "firebase-functions/logger";
import {hexToColorName} from "../utils/colorNames";

/**
 * Execute AI command using OpenAI Agents SDK
 * This is a thin wrapper around the core getAIToolCalls function
 * that adds Firebase-specific logging
 */
export async function executeAICommand(
  request: ProcessAICommandRequest
): Promise<ProcessAICommandResponse> {
  // Validate OpenAI is configured
  validateOpenAIConfig();

  const {command, canvasState, viewportCenter, selectedShapeIds, currentColor, currentStrokeWidth, viewportBounds} = request;

  logger.info("Processing AI command", {
    command: command.substring(0, 100),
    shapeCount: canvasState?.length || 0,
    selectedCount: selectedShapeIds?.length || 0,
    viewportCenter,
    viewportBounds,
  });

  // Calculate which shapes are in viewport for AI context (but don't filter them out)
  let inViewportIds: string[] = [];
  if (viewportBounds && canvasState && canvasState.length > 0) {
    inViewportIds = canvasState.filter(s => {
      // Get the shape's position (circles use centerX/centerY if available, otherwise x/y)
      const shapeX = s.type === 'circle' ? ((s as any).centerX ?? s.x) : s.x;
      const shapeY = s.type === 'circle' ? ((s as any).centerY ?? s.y) : s.y;
      
      return shapeX >= viewportBounds.x &&
             shapeX <= viewportBounds.x + viewportBounds.width &&
             shapeY >= viewportBounds.y &&
             shapeY <= viewportBounds.y + viewportBounds.height;
    }).map(s => s.id);
    
    logger.info("Viewport analysis", {
      viewportBounds,
      totalShapes: canvasState.length,
      inViewportCount: inViewportIds.length,
      inViewportIds
    });
  }

  // Always send full canvas state to AI - the AI needs complete context
  // Add colorName field to each shape for better AI understanding
  let filteredCanvasState = (canvasState || []).map(shape => {
    const fill = (shape as any).fill;
    if (fill && typeof fill === 'string') {
      return {
        ...shape,
        colorName: hexToColorName(fill)
      };
    }
    return shape;
  });

  // Log canvas state for debugging
  if (canvasState && canvasState.length > 0) {
    logger.info("Canvas state shapes", {
      shapes: canvasState.map(s => {
        const shapeX = s.type === 'circle' ? ((s as any).centerX ?? s.x) : s.x;
        const shapeY = s.type === 'circle' ? ((s as any).centerY ?? s.y) : s.y;
        const inViewport = viewportBounds ? (
          shapeX >= viewportBounds.x &&
          shapeX <= viewportBounds.x + viewportBounds.width &&
          shapeY >= viewportBounds.y &&
          shapeY <= viewportBounds.y + viewportBounds.height
        ) : 'unknown';
        return {
          id: s.id,
          type: s.type,
          x: shapeX,
          y: shapeY,
          inViewport
        };
      })
    });
  }

  // Log what's being sent to AI
  logger.info("Sending to AI", {
    shapesCount: filteredCanvasState.length,
    shapeIds: filteredCanvasState.map(s => s.id),
    selectedShapeIds,
    // Log full shape data to see what properties are available
    fullShapeData: filteredCanvasState.map(s => ({
      id: s.id,
      type: s.type,
      colorName: (s as any).colorName,
      fill: (s as any).fill,
      stroke: (s as any).stroke,
      x: s.x,
      y: s.y,
      radius: (s as any).radius,
      width: (s as any).width,
      height: (s as any).height
    }))
  });


  try {
    // Call core AI function (separated for testability)
    const result = await getAIToolCalls(
      command,
      filteredCanvasState,
      viewportCenter,
      selectedShapeIds,
      currentColor,
      currentStrokeWidth,
      viewportBounds,
      inViewportIds
    );

    if (result.success && result.toolCalls) {
      logger.info("OpenAI response received", {
        toolCallCount: result.toolCalls.length,
      });
    }

    return result;
  } catch (error) {
    logger.error("OpenAI API error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ?
        error.message :
        "Unknown error occurred",
    };
  }
}
