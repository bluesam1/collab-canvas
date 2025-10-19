/**
 * Client-side TypeScript types for AI Canvas Agent
 */

// AI mode types
export type AIMode = 'auto' | 'confirm';

// Tool call types (matches OpenAI function calling format)
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string of parameters
  };
}

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  affectedShapeIds: string[];
  error?: string;
}

// AI command request (sent to Cloud Function)
export interface AICommandRequest {
  command: string;
  canvasId: string;
  canvasState: CanvasShape[];
  viewportCenter: { x: number; y: number };
  viewportBounds?: { x: number; y: number; width: number; height: number }; // Visible canvas area
  selectedShapeIds?: string[];
  currentColor?: string; // Current selected color in UI
  currentStrokeWidth?: number; // Current stroke width in UI
}

// AI command response (received from Cloud Function)
export interface AICommandResponse {
  success: boolean;
  toolCalls?: ToolCall[];
  error?: string;
  summary?: string; // For confirm mode
}

// Canvas shape representation for AI context
export interface CanvasShape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  rotation?: number;
}

// AI state for React components
export interface AIState {
  isOpen: boolean;
  isLoading: boolean;
  mode: AIMode;
  command: string;
  response: string | null;
  error: string | null;
  pendingToolCalls: ToolCall[] | null;
  pendingSummary: string | null;
}

// Rate limiter state
export interface RateLimiterState {
  requests: number[];
  maxRequests: number;
  windowMs: number;
}

