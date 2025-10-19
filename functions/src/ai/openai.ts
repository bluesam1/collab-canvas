/**
 * OpenAI Client Configuration
 * Initializes OpenAI SDK with credentials from environment
 */

import OpenAI from "openai";

// Lazy-initialized OpenAI client
let openaiClient: OpenAI | null = null;

// Get or create OpenAI client (lazy initialization)
// In local development: reads from functions/.env.local
// In production: reads from Firebase Functions config/secrets
export const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured. " +
        "Set it in functions/.env.local for local development or " +
        "use 'firebase functions:secrets:set OPENAI_API_KEY' for production."
      );
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

// Get configured model (default to gpt-4.1 for improved performance)
export const getModel = (): string => {
  return process.env.OPENAI_MODEL || "gpt-4.1";
};

// Validate OpenAI configuration
export const validateOpenAIConfig = (): void => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured. " +
      "Set it in functions/.env.local for local development or " +
      "use 'firebase functions:secrets:set OPENAI_API_KEY' for production."
    );
  }
};

