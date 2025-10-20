import { database } from '../config/firebase';
import {
  ref,
  set,
  update,
  remove,
  onValue,
  onDisconnect,
  push,
  serverTimestamp,
  get,
} from 'firebase/database';
import type { DatabaseReference } from 'firebase/database';

// Error messages
export const ERROR_MESSAGES = {
  CONNECTION_LOST: 'Connection to server lost. Attempting to reconnect...',
  AUTH_REQUIRED: 'You must be signed in to perform this action.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Helper to handle Firebase errors
export const handleFirebaseError = (error: unknown): string => {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('offline')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    // Auth errors
    if (error.message.includes('permission') || error.message.includes('auth')) {
      return ERROR_MESSAGES.AUTH_REQUIRED;
    }
    // Generic error with message
    return error.message;
  }
  return ERROR_MESSAGES.OPERATION_FAILED;
};

// Retry helper for auth operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Object operations
export const createObject = async (canvasId: string, objectData: Record<string, unknown>) => {
  const objectsRef = ref(database, `objects/${canvasId}`);
  const newObjectRef = push(objectsRef);
  
  try {
    await set(newObjectRef, {
      ...objectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newObjectRef.key;
  } catch (error) {
    console.error('Error creating object:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const updateObject = async (canvasId: string, objectId: string, updates: Record<string, unknown>) => {
  const objectRef = ref(database, `objects/${canvasId}/${objectId}`);
  
  try {
    await update(objectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating object:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const deleteObject = async (canvasId: string, objectId: string) => {
  const objectRef = ref(database, `objects/${canvasId}/${objectId}`);
  
  try {
    await remove(objectRef);
  } catch (error) {
    console.error('Error deleting object:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const getObjects = async (canvasId: string) => {
  const objectsRef = ref(database, `objects/${canvasId}`);
  
  try {
    const snapshot = await get(objectsRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error fetching objects:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const subscribeToObjects = (canvasId: string, callback: (objects: Record<string, unknown>) => void) => {
  const objectsRef = ref(database, `objects/${canvasId}`);
  
  return onValue(objectsRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  }, (error) => {
    console.error('Error subscribing to objects:', error);
  });
};

// Presence operations
export const setUserPresence = async (canvasId: string, userId: string, userData: Record<string, unknown>) => {
  const presenceRef = ref(database, `presence/${canvasId}/${userId}`);
  
  try {
    await set(presenceRef, {
      ...userData,
      isOnline: true,
      lastActive: serverTimestamp(),
    });
    
    // Set up disconnect handler
    const disconnectRef = onDisconnect(presenceRef);
    await disconnectRef.update({
      isOnline: false,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting presence:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const updateUserPresence = async (canvasId: string, userId: string, updates: Record<string, unknown>) => {
  const presenceRef = ref(database, `presence/${canvasId}/${userId}`);
  
  try {
    await update(presenceRef, {
      ...updates,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating presence:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const subscribeToPresence = (canvasId: string, callback: (presence: Record<string, unknown>) => void) => {
  const presenceRef = ref(database, `presence/${canvasId}`);
  
  return onValue(presenceRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  }, (error) => {
    console.error('Error subscribing to presence:', error);
  });
};

// Cursor operations (with throttling handled by caller)
export const updateCursor = async (canvasId: string, userId: string, cursorData: { x: number; y: number; email: string; color?: string }) => {
  const cursorRef = ref(database, `presence/${canvasId}/${userId}/cursor`);
  
  try {
    await set(cursorRef, {
      ...cursorData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Silently fail for cursor updates to avoid spam
    console.debug('Error updating cursor:', error);
  }
};

export const clearCursor = async (canvasId: string, userId: string) => {
  const cursorRef = ref(database, `presence/${canvasId}/${userId}/cursor`);
  
  try {
    await remove(cursorRef);
  } catch (error) {
    console.debug('Error clearing cursor:', error);
  }
};

// Connection monitoring
export const subscribeToConnection = (
  onConnected: () => void,
  onDisconnected: () => void
) => {
  const connectedRef = ref(database, '.info/connected');
  
  return onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      onConnected();
    } else {
      onDisconnected();
    }
  });
};

// Simple reconnection logic
export const setupReconnection = (onReconnect: () => void) => {
  let wasDisconnected = false;
  
  return subscribeToConnection(
    () => {
      if (wasDisconnected) {
        console.log('Reconnected to Firebase');
        onReconnect();
      }
      wasDisconnected = false;
    },
    () => {
      console.warn(ERROR_MESSAGES.CONNECTION_LOST);
      wasDisconnected = true;
    }
  );
};

// User profile operations
export const createUserProfile = async (userId: string, email: string, color: string) => {
  const userRef = ref(database, `users/${userId}`);
  
  try {
    await set(userRef, {
      id: userId,
      email,
      color,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const getUserProfile = async (userId: string) => {
  const userRef = ref(database, `users/${userId}`);
  
  try {
    const snapshot = await get(userRef);
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const updateUserProfile = async (userId: string, updates: Record<string, unknown>) => {
  const userRef = ref(database, `users/${userId}`);
  
  try {
    await update(userRef, {
      ...updates,
      lastSeenAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(handleFirebaseError(error));
  }
};

// Helper to create a database reference
export const createRef = (path: string): DatabaseReference => {
  return ref(database, path);
};


