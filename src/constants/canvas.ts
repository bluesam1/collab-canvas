/**
 * Canvas constants and limits
 */

// Maximum number of objects allowed on a canvas
export const MAX_CANVAS_OBJECTS = 1000;

// Error messages
export const CANVAS_LIMITS = {
  MAX_OBJECTS_REACHED: `Canvas limit reached. Maximum ${MAX_CANVAS_OBJECTS} objects allowed.`,
  BATCH_CREATION_EXCEEDS_LIMIT: `Cannot create ${MAX_CANVAS_OBJECTS} objects. Canvas limit would be exceeded.`,
} as const;
