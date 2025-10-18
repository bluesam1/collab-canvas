/**
 * AI Service - Client-side integration with Cloud Functions
 * Handles calling the processAICommand Cloud Function
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { AICommandRequest, AICommandResponse } from '../types/ai';

// Rate limiter state
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Check if user can make another AI request (rate limiting)
 */
export const canMakeAIRequest = (): boolean => {
  const now = Date.now();
  // Remove old requests outside the time window
  rateLimiter.requests = rateLimiter.requests.filter(
    (time) => now - time < rateLimiter.windowMs
  );
  return rateLimiter.requests.length < rateLimiter.maxRequests;
};

/**
 * Record an AI request for rate limiting
 */
const recordAIRequest = (): void => {
  rateLimiter.requests.push(Date.now());
};

/**
 * Call the processAICommand Cloud Function
 */
export const processAICommand = async (
  request: AICommandRequest
): Promise<AICommandResponse> => {
  // Check rate limit
  if (!canMakeAIRequest()) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }

  // Record this request
  recordAIRequest();

  try {
    // Get the Cloud Function callable
    const processCommand = httpsCallable<AICommandRequest, AICommandResponse>(
      functions,
      'processAICommand'
    );

    // Track request timing
    const startTime = Date.now();
    
    // Log warning after 2 seconds if still processing
    const warningTimer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.warn(`⏱️ AI request taking longer than expected (${elapsed}ms)...`);
    }, 2000);

    const result = await processCommand(request);
    clearTimeout(warningTimer);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ AI request completed in ${elapsed}ms`);

    return result.data;
  } catch (error: any) {
    console.error('AI service error:', error);

    // Handle specific error types
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to use AI Assistant.');
    }

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to use AI Assistant.');
    }

    if (error.message?.includes('timeout') || error.message?.includes('took too long')) {
      throw new Error('Request took too long. Please try a simpler command.');
    }

    // Generic error
    throw new Error(
      error.message || 'We couldn\'t figure out how to handle your request. Please try again.'
    );
  }
};

