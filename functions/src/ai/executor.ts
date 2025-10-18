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

  const {command, canvasState, viewportCenter, selectedShapeIds, currentColor, currentStrokeWidth} = request;

  logger.info("Processing AI command", {
    command: command.substring(0, 100),
    shapeCount: canvasState?.length || 0,
    selectedCount: selectedShapeIds?.length || 0,
  });

  try {
    // Call core AI function (separated for testability)
    const result = await getAIToolCalls(
      command,
      canvasState || [],
      viewportCenter,
      selectedShapeIds,
      currentColor,
      currentStrokeWidth
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
