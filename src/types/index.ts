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

// Canvas types (for future use)
export interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  objects: Rectangle[];
  selectedIds: string[];
  isLoading: boolean;
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
  objects: Rectangle[];
  selectedIds: string[];
  isLoading: boolean;
  createObject: (object: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateObject: (id: string, updates: Partial<Rectangle>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
}

// Presence context type
export interface PresenceContextType {
  onlineUsers: Map<string, PresenceUser>;
  cursors: Map<string, CursorPosition>;
  updateCursor: (position: { x: number; y: number }) => void;
}

