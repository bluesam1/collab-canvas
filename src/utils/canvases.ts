import { ref, set, get, push, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { type Canvas, type CanvasListItem } from '../types';

/**
 * Create a new canvas with a name and owner ID
 * @param name - The name of the canvas
 * @param ownerId - The ID of the user creating the canvas
 * @returns Promise<string> - The new canvas ID
 */
export async function createCanvas(name: string, ownerId: string): Promise<string> {
  const canvasRef = push(ref(database, 'canvases'));
  const canvasId = canvasRef.key!;
  
  const now = Date.now();
  const canvas: Canvas = {
    id: canvasId,
    name: name.trim(),
    ownerId,
    createdAt: now,
    updatedAt: now,
    lastOpenedBy: {
      [ownerId]: now
    }
  };
  
  await set(canvasRef, canvas);
  return canvasId;
}

/**
 * Retrieve canvas metadata by canvas ID
 * @param canvasId - The ID of the canvas to retrieve
 * @returns Promise<Canvas | null> - The canvas data or null if not found
 */
export async function getCanvas(canvasId: string): Promise<Canvas | null> {
  const canvasRef = ref(database, `canvases/${canvasId}`);
  const snapshot = await get(canvasRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.val() as Canvas;
}

/**
 * Update the "last opened" timestamp for a specific user on a specific canvas
 * @param canvasId - The ID of the canvas
 * @param userId - The ID of the user
 */
export async function updateLastOpened(canvasId: string, userId: string): Promise<void> {
  const lastOpenedRef = ref(database, `canvases/${canvasId}/lastOpenedBy/${userId}`);
  await set(lastOpenedRef, Date.now());
}

/**
 * Get all canvases that a user can see (either they own it OR they've opened it before)
 * @param userId - The ID of the user
 * @returns Promise<CanvasListItem[]> - Array of canvases sorted by most recently opened
 */
export async function getUserCanvases(userId: string): Promise<CanvasListItem[]> {
  const canvasesRef = ref(database, 'canvases');
  const snapshot = await get(canvasesRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const canvases = snapshot.val() as Record<string, Canvas>;
  const userCanvases: CanvasListItem[] = [];
  
  for (const [, canvas] of Object.entries(canvases)) {
    // Check if user owns this canvas or has opened it before
    if (canvas.ownerId === userId || canvas.lastOpenedBy[userId]) {
      const canvasListItem: CanvasListItem = {
        ...canvas,
        isOwner: canvas.ownerId === userId,
        lastOpenedByMe: canvas.lastOpenedBy[userId]
      };
      userCanvases.push(canvasListItem);
    }
  }
  
  // Sort by most recently opened (lastOpenedByMe), then by updatedAt
  return userCanvases.sort((a, b) => {
    const aTime = a.lastOpenedByMe || a.updatedAt;
    const bTime = b.lastOpenedByMe || b.updatedAt;
    return bTime - aTime;
  });
}

/**
 * Search through a user's accessible canvases by name
 * @param userId - The ID of the user
 * @param searchQuery - The search query (case-insensitive)
 * @returns Promise<CanvasListItem[]> - Array of matching canvases
 */
export async function searchUserCanvases(userId: string, searchQuery: string): Promise<CanvasListItem[]> {
  const allCanvases = await getUserCanvases(userId);
  const query = searchQuery.toLowerCase().trim();
  
  if (!query) {
    return allCanvases;
  }
  
  return allCanvases.filter(canvas => 
    canvas.name.toLowerCase().includes(query)
  );
}

/**
 * Rename a canvas (should only work if user is owner)
 * @param canvasId - The ID of the canvas to rename
 * @param newName - The new name for the canvas
 * @param userId - The ID of the user attempting to rename
 * @returns Promise<boolean> - True if successful, false if user is not owner
 */
export async function renameCanvas(canvasId: string, newName: string, userId: string): Promise<boolean> {
  const canvasRef = ref(database, `canvases/${canvasId}`);
  const snapshot = await get(canvasRef);
  
  if (!snapshot.exists()) {
    return false;
  }
  
  const canvas = snapshot.val() as Canvas;
  if (canvas.ownerId !== userId) {
    return false;
  }
  
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return false;
  }
  
  await set(ref(database, `canvases/${canvasId}/name`), trimmedName);
  await set(ref(database, `canvases/${canvasId}/updatedAt`), Date.now());
  
  return true;
}

/**
 * Delete a canvas and all its associated data (should only work if user is owner)
 * @param canvasId - The ID of the canvas to delete
 * @param userId - The ID of the user attempting to delete
 * @returns Promise<boolean> - True if successful, false if user is not owner
 */
export async function deleteCanvas(canvasId: string, userId: string): Promise<boolean> {
  const canvasRef = ref(database, `canvases/${canvasId}`);
  const snapshot = await get(canvasRef);
  
  if (!snapshot.exists()) {
    return false;
  }
  
  const canvas = snapshot.val() as Canvas;
  if (canvas.ownerId !== userId) {
    return false;
  }
  
  // Delete canvas metadata
  await remove(canvasRef);
  
  // Delete all objects in this canvas
  const objectsRef = ref(database, `objects/${canvasId}`);
  await remove(objectsRef);
  
  // Delete all presence data for this canvas
  const presenceRef = ref(database, `presence/${canvasId}`);
  await remove(presenceRef);
  
  return true;
}

/**
 * Check if a canvas exists and is accessible
 * @param canvasId - The ID of the canvas to check
 * @returns Promise<boolean> - True if canvas exists
 */
export async function canvasExists(canvasId: string): Promise<boolean> {
  const canvas = await getCanvas(canvasId);
  return canvas !== null;
}

/**
 * Leave a shared canvas (remove from user's list)
 * @param canvasId - The ID of the canvas to leave
 * @param userId - The ID of the user leaving
 * @returns Promise<boolean> - True if successful, false if user is owner
 */
export async function leaveCanvas(canvasId: string, userId: string): Promise<boolean> {
  const canvasRef = ref(database, `canvases/${canvasId}`);
  const snapshot = await get(canvasRef);
  
  if (!snapshot.exists()) {
    return false;
  }
  
  const canvas = snapshot.val() as Canvas;
  if (canvas.ownerId === userId) {
    return false; // Owners cannot leave their own canvas
  }
  
  // Remove user from lastOpenedBy
  const lastOpenedRef = ref(database, `canvases/${canvasId}/lastOpenedBy/${userId}`);
  await remove(lastOpenedRef);
  
  return true;
}
