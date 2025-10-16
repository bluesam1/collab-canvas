// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  color?: string; // Assigned color from palette
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sendEmailLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Canvas types
export type CanvasMode = 'pan' | 'rectangle' | 'circle' | 'line' | 'text';
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text';

export interface Canvas {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedBy: Record<string, number>; // userId -> timestamp
}

export interface CanvasListItem extends Canvas {
  isOwner: boolean;
  lastOpenedByMe?: number;
}

export interface Rectangle {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Circle {
  id: string;
  type: 'circle';
  centerX: number;
  centerY: number;
  radius: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Line {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Text {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// Union type for all shapes
export type Shape = Rectangle | Circle | Line | Text;

export interface CanvasState {
  objects: Shape[];
  selectedIds: string[];
  isLoading: boolean;
  mode: CanvasMode;
}

// Presence types (for future use)
export interface CursorPosition {
  x: number;
  y: number;
  email: string;
  color: string;
  timestamp: number;
}

export interface PresenceUser {
  uid: string;
  email: string;
  color: string;
  isOnline: boolean;
  lastActive: number;
  cursor?: CursorPosition;
}

export interface PresenceState {
  onlineUsers: Map<string, PresenceUser>;
  cursors: Map<string, CursorPosition>;
}

// Canvas context type
export interface CanvasContextType {
  objects: Shape[];
  selectedIds: string[];
  isLoading: boolean;
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  createObject: (object: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Line, 'id' | 'createdAt' | 'updatedAt'> | Omit<Text, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateObject: (id: string, updates: Partial<Shape>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
}

// Presence context type
export interface PresenceContextType {
  onlineUsers: Map<string, PresenceUser>;
  cursors: Map<string, CursorPosition>;
  updateCursor: (position: { x: number; y: number }) => void;
}

// Type guards for shape type validation
export const isRectangle = (shape: Shape): shape is Rectangle => shape.type === 'rectangle';
export const isCircle = (shape: Shape): shape is Circle => shape.type === 'circle';
export const isLine = (shape: Shape): shape is Line => shape.type === 'line';
export const isText = (shape: Shape): shape is Text => shape.type === 'text';

