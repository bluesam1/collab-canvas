/**
 * Shared TypeScript types for AI Canvas Agent (Server-side)
 * Used by Cloud Functions
 */

// Tool function parameters for shape creation
export interface CreateRectangleParams {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface CreateCircleParams {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface CreateLineParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface CreateTextParams {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

// Tool function parameters for shape manipulation
export interface MoveShapesParams {
  shapeIds: string[];
  x: number;
  y: number;
  relative: boolean;
}

export interface ResizeShapesParams {
  shapeIds: string[];
  scaleFactor: number;
}

export interface RotateShapesParams {
  shapeIds: string[];
  degrees: number;
}

export interface ChangeColorParams {
  shapeIds: string[];
  color: string;
}

export interface DeleteShapesParams {
  shapeIds: string[];
}

// Tool function parameters for layout operations
export interface ArrangeInGridParams {
  shapeIds: string[];
  rows: number;
  cols: number;
  spacingX: number;
  spacingY: number;
}

export interface AlignShapesParams {
  shapeIds: string[];
  alignment: 'left' | 'right' | 'center' | 'top' | 'bottom';
}

export interface DistributeShapesParams {
  shapeIds: string[];
  direction: 'horizontal' | 'vertical';
}

export interface SelectShapesParams {
  shapeIds: string[];
}

// Canvas state for context
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

export interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

// Cloud Function request/response types
export interface ProcessAICommandRequest {
  command: string;
  canvasId: string;
  canvasState: CanvasShape[];
  viewportCenter: { x: number; y: number };
  selectedShapeIds?: string[];
  currentColor?: string; // Current selected color in UI
  currentStrokeWidth?: number; // Current stroke width in UI
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string of parameters
  };
}

export interface ProcessAICommandResponse {
  success: boolean;
  toolCalls?: ToolCall[];
  error?: string;
  summary?: string; // For confirm mode preview
}

