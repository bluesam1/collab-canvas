/**
 * Firebase Cloud Functions for AI Canvas Agent
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import type {
  ProcessAICommandRequest,
  ProcessAICommandResponse,
} from "./types/ai";
import {executeAICommand} from "./ai/executor";

// Initialize Firebase Admin
initializeApp();

// Global options for all functions
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
});

/**
 * Cloud Function to process AI commands
 * Accepts natural language commands and returns OpenAI function calls
 */
export const processAICommand = onCall<
  ProcessAICommandRequest,
  Promise<ProcessAICommandResponse>
>(
  {
    cors: true,
    // Enforce authentication
    enforceAppCheck: false, // Set to true in production with App Check
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      logger.warn("Unauthenticated request to processAICommand");
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to use AI Assistant"
      );
    }

    const userId = request.auth.uid;
    const {command, canvasId, canvasState, viewportCenter} = request.data;

    // Validate required fields
    if (!command || typeof command !== "string") {
      throw new HttpsError("invalid-argument", "Command is required");
    }

    if (!canvasId || typeof canvasId !== "string") {
      throw new HttpsError("invalid-argument", "Canvas ID is required");
    }

    if (!viewportCenter || typeof viewportCenter.x !== "number" ||
        typeof viewportCenter.y !== "number") {
      throw new HttpsError(
        "invalid-argument",
        "Viewport center is required"
      );
    }

    logger.info("Processing AI command", {
      userId,
      canvasId,
      command: command.substring(0, 100), // Log first 100 chars
      shapeCount: canvasState?.length || 0,
    });

    try {
      // Execute AI command using OpenAI
      const result = await executeAICommand(request.data);
      return result;
    } catch (error) {
      logger.error("Error processing AI command", {
        userId,
        canvasId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to process AI command. Please try again."
      );
    }
  }
);
