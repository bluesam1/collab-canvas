import { createContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Shape, CanvasContextType, CanvasMode, Rectangle, Circle, Line, Text, UndoState, UndoOperationType } from '../types';
import { 
  subscribeToObjects, 
  updateObject as updateFirebaseObject,
  deleteObject as deleteFirebaseObject
} from '../utils/firebase';
import { ref, push, set } from 'firebase/database';
import { database } from '../config/firebase';
import { MAX_CANVAS_OBJECTS, CANVAS_LIMITS } from '../constants/canvas';
import { useToast } from '../hooks/useToast';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';
import { usePresence } from '../hooks/usePresence';

// Create the context
export const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasContextProviderProps {
  children: ReactNode;
  canvasId: string;
}

export const CanvasContextProvider = ({ children, canvasId }: CanvasContextProviderProps) => {
  const [objects, setObjects] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<CanvasMode>('pan'); // Default to pan mode
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [disableUndoCapture, setDisableUndoCapture] = useState(false);
  const [redoState, setRedoState] = useState<UndoState | null>(null);
  const [clipboard, setClipboard] = useState<{ objects: Shape[]; pasteOffset: number }>({
    objects: [],
    pasteOffset: 0,
  });
  const { showToast } = useToast();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { onlineUsers } = usePresence();
  
  // Track previous objects for detecting changes
  const previousObjectsRef = useRef<Map<string, Shape>>(new Map());
  
  // Track objects being deleted by current user (to prevent self-notifications)
  const userDeletingIdsRef = useRef<Set<string>>(new Set());
  
  // Track objects being created by current user (to prevent self-notifications)
  const userCreatingIdsRef = useRef<Set<string>>(new Set());

  // Set up Firebase listener for real-time sync
  useEffect(() => {
    setIsLoading(true);

    // Subscribe to objects in Firebase for this specific canvas
    const unsubscribe = subscribeToObjects(canvasId, (data: Record<string, unknown>) => {
      // Convert Firebase object format to array
      const objectsArray: Shape[] = Object.entries(data).map(([id, obj]) => {
        const objectData = obj as Record<string, unknown>;
        const type = objectData.type as string;
        
        // Create base shape data
        const baseShape = {
          id,
          createdBy: objectData.createdBy as string,
          createdAt: objectData.createdAt as number,
          updatedAt: objectData.updatedAt as number,
        };

        // Create shape based on type
        switch (type) {
          case 'rectangle':
            return {
              ...baseShape,
              type: 'rectangle' as const,
              x: objectData.x as number,
              y: objectData.y as number,
              width: objectData.width as number,
              height: objectData.height as number,
              fill: objectData.fill as string,
              rotation: (objectData.rotation as number) ?? 0, // Default to 0 for backward compatibility
            } as Rectangle;
          case 'circle':
            return {
              ...baseShape,
              type: 'circle' as const,
              centerX: objectData.centerX as number,
              centerY: objectData.centerY as number,
              radius: objectData.radius as number,
              fill: objectData.fill as string,
              rotation: (objectData.rotation as number) ?? 0, // Default to 0 for backward compatibility
            } as Circle;
          case 'line':
            return {
              ...baseShape,
              type: 'line' as const,
              x: objectData.x as number,
              y: objectData.y as number,
              width: objectData.width as number,
              height: (objectData.height as number) ?? 0,
              stroke: objectData.stroke as string,
              strokeWidth: objectData.strokeWidth as number,
              rotation: (objectData.rotation as number) ?? 0,
            } as Line;
          case 'text':
            return {
              ...baseShape,
              type: 'text' as const,
              x: objectData.x as number,
              y: objectData.y as number,
              text: objectData.text as string,
              fontSize: objectData.fontSize as number,
              fill: objectData.fill as string,
              rotation: (objectData.rotation as number) ?? 0, // Default to 0 for backward compatibility
              bold: objectData.bold as boolean | undefined,
              italic: objectData.italic as boolean | undefined,
              underline: objectData.underline as boolean | undefined,
            } as Text;
          default:
            // Fallback to rectangle for backward compatibility
            return {
              ...baseShape,
              type: 'rectangle' as const,
              x: objectData.x as number,
              y: objectData.y as number,
              width: objectData.width as number,
              height: objectData.height as number,
              fill: objectData.fill as string,
              rotation: (objectData.rotation as number) ?? 0, // Default to 0 for backward compatibility
            } as Rectangle;
        }
      });

      // Detect object creation/deletion for notifications
      console.log('[CanvasContext] Notification detection check:', {
        isLoading,
        hasUser: !!user,
        objectCount: objectsArray.length,
        previousObjectCount: previousObjectsRef.current.size,
        onlineUsersSize: onlineUsers.size,
      });
      
      if (!isLoading && user) {
        const currentIds = new Set(objectsArray.map(obj => obj.id));
        const previousIds = new Set(previousObjectsRef.current.keys());

        // Detect new objects (created by others)
        objectsArray.forEach(obj => {
          if (!previousIds.has(obj.id) && !userCreatingIdsRef.current.has(obj.id) && obj.createdBy !== user.uid) {
            // Object was just created by another user
            // Look up user details from presence
            const creatorUser = onlineUsers.get(obj.createdBy);
            const userEmail = creatorUser?.email || 'A collaborator';
            const userColor = creatorUser?.color || '#6366f1';
            
            console.log('[CanvasContext] Object created by other user:', {
              objectId: obj.id,
              type: obj.type,
              createdBy: obj.createdBy,
              userEmail,
              userColor,
              onlineUsersSize: onlineUsers.size,
            });
            
            addNotification({
              type: 'object-created',
              userEmail,
              userColor,
              message: `created a ${obj.type}`,
              shapeType: obj.type,
            });
          }
          
          // Remove from userCreatingIdsRef after processing
          if (userCreatingIdsRef.current.has(obj.id)) {
            userCreatingIdsRef.current.delete(obj.id);
          }
        });

        // Detect modified objects (modified by others)
        // DISABLED: Modification notifications not working reliably - needs further debugging
        // The updatedBy field is still being set, but notifications are disabled for now
        // TODO: Re-enable after fixing detection logic
        /*
        objectsArray.forEach(obj => {
          const previousObj = previousObjectsRef.current.get(obj.id);
          if (previousObj && obj.updatedBy) {
            const updatedByChanged = previousObj.updatedBy !== obj.updatedBy;
            const updatedByOtherUser = obj.updatedBy !== user.uid;
            
            if (updatedByChanged && updatedByOtherUser) {
              const modifierUser = onlineUsers.get(obj.updatedBy);
              const userEmail = modifierUser?.email || 'A collaborator';
              const userColor = modifierUser?.color || '#6366f1';
              
              addNotification({
                type: 'object-modified',
                userEmail,
                userColor,
                message: `modified a ${obj.type}`,
                shapeType: obj.type,
              });
            }
          }
        });
        */

        // Detect deleted objects (deleted by others)
        previousObjectsRef.current.forEach((obj, id) => {
          if (!currentIds.has(id) && !userDeletingIdsRef.current.has(id)) {
            // Object was deleted by another user
            // Look up user details from presence (try to get the user who last modified it)
            const deleterUser = onlineUsers.get(obj.createdBy);
            const userEmail = deleterUser?.email || 'A collaborator';
            const userColor = deleterUser?.color || '#6366f1';
            
            console.log('[CanvasContext] Object deleted by other user:', {
              objectId: id,
              type: obj.type,
              createdBy: obj.createdBy,
              userEmail,
              userColor,
              onlineUsersSize: onlineUsers.size,
            });
            
            addNotification({
              type: 'object-deleted',
              userEmail,
              userColor,
              message: `deleted a ${obj.type}`,
              shapeType: obj.type,
            });
          }
          
          // Remove from userDeletingIdsRef after processing
          if (userDeletingIdsRef.current.has(id)) {
            userDeletingIdsRef.current.delete(id);
          }
        });
      }

      // Update previous objects map for next comparison
      previousObjectsRef.current = new Map(objectsArray.map(obj => [obj.id, obj]));

      setObjects(objectsArray);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, user, addNotification]);
  // Note: isLoading is NOT in deps - it's only used inside the effect callback, not as a trigger
  // Note: onlineUsers is NOT in deps - we only use it for lookups, don't need to re-subscribe when it changes

  // Undo helper functions
  const captureUndoSnapshot = (operation: UndoOperationType, affectedIds: string[]) => {
    // Skip if undo capture is disabled (e.g., during AI batch operations)
    if (disableUndoCapture) {
      return;
    }
    
    // Clear redo state when a new action is performed
    setRedoState(null);
    
    // Capture current state of affected shapes BEFORE operation
    const shapesSnapshot = objects.filter(obj => affectedIds.includes(obj.id));
    
    setUndoState({
      operation,
      shapesSnapshot,
      affectedIds,
      timestamp: Date.now(),
    });
  };

  const clearUndo = () => {
    setUndoState(null);
  };

  const undo = async () => {
    if (!undoState) {
      return;
    }

    // Disable auto-capture during undo to prevent creating new undo state
    setDisableUndoCapture(true);

    // Save current state as redo state before undoing
    setRedoState({
      operation: undoState.operation,
      affectedIds: undoState.affectedIds,
      shapesSnapshot: objects.filter(obj => undoState.affectedIds.includes(obj.id)),
      timestamp: Date.now(),
    });

    switch (undoState.operation) {
      case 'create':
        // Delete the created shapes
        await deleteObject(undoState.affectedIds);
        break;

      case 'delete':
        // Restore the deleted shapes
        for (const shape of undoState.shapesSnapshot) {
          // Remove id, createdAt, updatedAt and recreate with same ID
          const { id, createdAt, updatedAt, ...shapeData } = shape;
          const now = Date.now();
          
          // Optimistic update
          setObjects((prev) => [...prev, { ...shape, updatedAt: now }]);
          
          // Write to Firebase with original ID
          try {
            const specificObjectRef = ref(database, `objects/${canvasId}/${id}`);
            await set(specificObjectRef, {
              ...shapeData,
              id,
              createdAt,
              updatedAt: now,
            });
          } catch (error) {
            console.error('Error restoring object in Firebase:', error);
          }
        }
        break;

      case 'modify':
        // Restore previous state of modified shapes - batch update all at once
        const now = Date.now();
        
        // Create a map of ID -> original shape for quick lookup
        const shapeMap = new Map(undoState.shapesSnapshot.map(s => [s.id, s]));
        
        // Optimistic update: restore all shapes at once
        setObjects((prev) =>
          prev.map((obj) => {
            const originalShape = shapeMap.get(obj.id);
            return originalShape ? { ...originalShape, updatedAt: now } : obj;
          })
        );

        // Write to Firebase - batch all updates
        await Promise.all(
          undoState.shapesSnapshot.map((shape) => {
            const { id, createdAt, updatedAt, ...shapeUpdates } = shape;
            return updateFirebaseObject(canvasId, id, { ...shapeUpdates, updatedAt: now });
          })
        );
        break;
    }

    // Re-enable auto-capture
    setDisableUndoCapture(false);

    // Clear undo state after using it (single-level undo)
    setUndoState(null);
  };

  const redo = async () => {
    if (!redoState) {
      return;
    }

    // Disable auto-capture during redo to prevent creating new undo state
    setDisableUndoCapture(true);

    // Save current state as undo state before redoing
    setUndoState({
      operation: redoState.operation,
      affectedIds: redoState.affectedIds,
      shapesSnapshot: objects.filter(obj => redoState.affectedIds.includes(obj.id)),
      timestamp: Date.now(),
    });

    switch (redoState.operation) {
      case 'create':
        // Recreate the shapes
        for (const shape of redoState.shapesSnapshot) {
          const { id, createdAt, updatedAt, ...shapeData } = shape;
          const now = Date.now();
          
          // Optimistic update
          setObjects((prev) => [...prev, { ...shape, updatedAt: now }]);
          
          // Write to Firebase with original ID
          try {
            const specificObjectRef = ref(database, `objects/${canvasId}/${id}`);
            await set(specificObjectRef, {
              ...shapeData,
              id,
              createdAt,
              updatedAt: now,
            });
          } catch (error) {
            console.error('Error recreating object in Firebase:', error);
          }
        }
        break;

      case 'delete':
        // Delete the shapes again
        await deleteObject(redoState.affectedIds);
        break;

      case 'modify':
        // Reapply modifications
        const now = Date.now();
        
        // Create a map of ID -> modified shape for quick lookup
        const shapeMap = new Map(redoState.shapesSnapshot.map(s => [s.id, s]));
        
        // Optimistic update: restore all shapes at once
        setObjects((prev) =>
          prev.map((obj) => {
            const modifiedShape = shapeMap.get(obj.id);
            return modifiedShape ? { ...modifiedShape, updatedAt: now } : obj;
          })
        );

        // Write to Firebase - batch all updates
        await Promise.all(
          redoState.shapesSnapshot.map((shape) => {
            const { id, createdAt, updatedAt, ...shapeUpdates } = shape;
            return updateFirebaseObject(canvasId, id, { ...shapeUpdates, updatedAt: now });
          })
        );
        break;
    }

    // Re-enable auto-capture
    setDisableUndoCapture(false);

    // Clear redo state after using it
    setRedoState(null);
  };

  // Create a new object with Firebase integration
  const createObject = async (objectData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Line, 'id' | 'createdAt' | 'updatedAt'> | Omit<Text, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    // Check canvas object limit
    if (objects.length >= MAX_CANVAS_OBJECTS) {
      console.error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      showToast(CANVAS_LIMITS.MAX_OBJECTS_REACHED, 'error');
      return null;
    }

    // Generate a unique ID using Firebase push
    const objectsRef = ref(database, `objects/${canvasId}`);
    const newObjectRef = push(objectsRef);
    const objectId = newObjectRef.key;

    if (!objectId) {
      console.error('Failed to generate object ID');
      return null;
    }

    const now = Date.now();
    const newObject: Shape = {
      ...objectData,
      id: objectId,
      createdAt: now,
      updatedAt: now,
    } as Shape;

    // Mark this object as being created by current user (to prevent self-notifications)
    userCreatingIdsRef.current.add(objectId);

    // Optimistic update: add to local state immediately
    setObjects((prev) => [...prev, newObject]);

    // Write to Firebase using the specific object ref with our generated ID
    try {
      const specificObjectRef = ref(database, `objects/${canvasId}/${objectId}`);
      await set(specificObjectRef, {
        ...objectData,
        id: objectId,
        createdAt: now,
        updatedAt: now,
      });
      
      // Capture undo snapshot AFTER successful creation
      captureUndoSnapshot('create', [objectId]);
      
      return objectId;
    } catch (error) {
      console.error('Error creating object in Firebase:', error);
      // Rollback optimistic update on error
      setObjects((prev) => prev.filter((obj) => obj.id !== objectId));
      return null;
    }
  };

  // Create multiple objects in batch (optimized for AI bulk operations)
  const createObjectsBatch = async (
    objectsData: Array<Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Line, 'id' | 'createdAt' | 'updatedAt'> | Omit<Text, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<string[]> => {
    if (objectsData.length === 0) return [];

    // Check canvas object limit
    if (objects.length >= MAX_CANVAS_OBJECTS) {
      console.error(CANVAS_LIMITS.MAX_OBJECTS_REACHED);
      showToast(CANVAS_LIMITS.MAX_OBJECTS_REACHED, 'error');
      return [];
    }

    // Check if batch creation would exceed limit
    if (objects.length + objectsData.length > MAX_CANVAS_OBJECTS) {
      console.error(CANVAS_LIMITS.BATCH_CREATION_EXCEEDS_LIMIT);
      showToast(CANVAS_LIMITS.BATCH_CREATION_EXCEEDS_LIMIT, 'error');
      return [];
    }

    const now = Date.now();
    const objectsRef = ref(database, `objects/${canvasId}`);
    
    // Generate IDs and create all shape objects in memory
    const newShapes: Shape[] = [];
    const firebaseUpdates: Record<string, any> = {};
    const ids: string[] = [];

    for (const objectData of objectsData) {
      const newObjectRef = push(objectsRef);
      const objectId = newObjectRef.key;
      
      if (!objectId) {
        console.error('Failed to generate object ID');
        continue;
      }

      const newObject: Shape = {
        ...objectData,
        id: objectId,
        createdAt: now,
        updatedAt: now,
      } as Shape;

      newShapes.push(newObject);
      ids.push(objectId);
      
      // Prepare Firebase update path
      firebaseUpdates[`objects/${canvasId}/${objectId}`] = {
        ...objectData,
        id: objectId,
        createdAt: now,
        updatedAt: now,
      };
      
      // Mark this object as being created by current user (to prevent self-notifications)
      userCreatingIdsRef.current.add(objectId);
    }

    // Single state update for all shapes (1 re-render instead of N)
    setObjects((prev) => [...prev, ...newShapes]);

    // Single Firebase write for all shapes
    try {
      const { update } = await import('firebase/database');
      await update(ref(database), firebaseUpdates);
      
      // Capture undo snapshot AFTER successful creation
      captureUndoSnapshot('create', ids);
      
      return ids;
    } catch (error) {
      console.error('Error creating objects in Firebase:', error);
      // Rollback optimistic update on error
      const idsSet = new Set(ids);
      setObjects((prev) => prev.filter((obj) => !idsSet.has(obj.id)));
      return [];
    }
  };

  // Update an existing object with Firebase integration
  const updateObject = async (id: string, updates: Partial<Shape>) => {
    // Note: Undo snapshot should be captured by the caller before batch operations
    // For single updates, caller should use captureUndoSnapshot manually
    // Don't auto-capture here to avoid overwriting batch operation snapshots
    
    const now = Date.now();
    
    // Optimistic update: update local state immediately
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, ...updates, updatedAt: now, updatedBy: user?.uid } as Shape
          : obj
      )
    );

    // Write to Firebase
    try {
      await updateFirebaseObject(canvasId, id, {
        ...updates,
        updatedAt: now,
        updatedBy: user?.uid,
      });
    } catch (error) {
      console.error('Error updating object in Firebase:', error);
      // Note: Firebase listener will revert to correct state
    }
  };

  // Batch update multiple objects with a single Firebase write
  const updateObjectsBatch = async (updatesMap: Map<string, Partial<Shape>>) => {
    const now = Date.now();
    
    // Optimistic update: update all objects in local state immediately
    setObjects((prev) =>
      prev.map((obj) =>
        updatesMap.has(obj.id)
          ? { ...obj, ...updatesMap.get(obj.id)!, updatedAt: now, updatedBy: user?.uid } as Shape
          : obj
      )
    );

    // Build Firebase update object
    const firebaseUpdates: Record<string, any> = {};
    updatesMap.forEach((updates, id) => {
      const fullPath = `objects/${canvasId}/${id}`;
      Object.entries(updates).forEach(([key, value]) => {
        firebaseUpdates[`${fullPath}/${key}`] = value;
      });
      firebaseUpdates[`${fullPath}/updatedAt`] = now;
      firebaseUpdates[`${fullPath}/updatedBy`] = user?.uid;
    });

    // Single Firebase write for all updates
    try {
      const { update } = await import('firebase/database');
      await update(ref(database), firebaseUpdates);
    } catch (error) {
      console.error('Error batch updating objects in Firebase:', error);
      // Note: Firebase listener will revert to correct state
    }
  };

  // Delete an object with Firebase integration
  // Delete one or multiple objects
  const deleteObject = async (ids: string | string[]) => {
    // Normalize to array
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    
    // Mark these objects as being deleted by current user (to prevent self-notifications)
    idsToDelete.forEach(id => userDeletingIdsRef.current.add(id));
    
    // Capture undo snapshot BEFORE deleting
    captureUndoSnapshot('delete', idsToDelete);
    
    // Optimistic update: remove from local state immediately
    setObjects((prev) => prev.filter((obj) => !idsToDelete.includes(obj.id)));
    
    // Clear selection if any deleted objects were selected
    setSelectedIds((prev) => prev.filter((selectedId) => !idsToDelete.includes(selectedId)));

    // Remove from Firebase (batch delete)
    try {
      await Promise.all(
        idsToDelete.map(id => deleteFirebaseObject(canvasId, id))
      );
    } catch (error) {
      console.error('Error deleting objects from Firebase:', error);
      // Note: Firebase listener will restore correct state
    }
  };

  // Select an object (supports multi-select with Shift key)
  const selectObject = (id: string | null, addToSelection = false) => {
    if (id === null) {
      setSelectedIds([]);
    } else if (addToSelection) {
      // Add to or remove from selection (toggle)
      setSelectedIds((prev) => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      );
    } else {
      // Replace selection with single object
      setSelectedIds([id]);
    }
  };

  // Select multiple objects at once
  const selectMultiple = (ids: string[]) => {
    setSelectedIds(ids);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Delete all selected objects
  const deleteSelected = async () => {
    const idsToDelete = [...selectedIds];
    
    if (idsToDelete.length === 0) return;
    
    // Capture undo snapshot BEFORE deleting
    captureUndoSnapshot('delete', idsToDelete);
    
    // Clear selection immediately
    setSelectedIds([]);
    
    // Optimistic update: remove all selected objects from local state
    setObjects((prev) => prev.filter((obj) => !idsToDelete.includes(obj.id)));
    
    // Delete from Firebase
    try {
      await Promise.all(
        idsToDelete.map(id => deleteFirebaseObject(canvasId, id))
      );
    } catch (error) {
      console.error('Error deleting objects from Firebase:', error);
      // Note: Firebase listener will restore correct state
    }
  };

  // Copy selected objects to clipboard
  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    
    setClipboard({
      objects: selectedObjects,
      pasteOffset: 0, // Reset offset when copying new objects
    });
    
    const count = selectedObjects.length;
    showToast(`${count} object${count !== 1 ? 's' : ''} copied`, 'success');
  };

  // Paste objects from clipboard
  const handlePaste = async (viewportCenter?: { x: number; y: number }) => {
    if (clipboard.objects.length === 0 || !user) return;
    
    // Calculate the center of the copied objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    clipboard.objects.forEach(obj => {
      if (obj.type === 'rectangle') {
        minX = Math.min(minX, obj.x);
        minY = Math.min(minY, obj.y);
        maxX = Math.max(maxX, obj.x + obj.width);
        maxY = Math.max(maxY, obj.y + obj.height);
      } else if (obj.type === 'circle') {
        minX = Math.min(minX, obj.centerX - obj.radius);
        minY = Math.min(minY, obj.centerY - obj.radius);
        maxX = Math.max(maxX, obj.centerX + obj.radius);
        maxY = Math.max(maxY, obj.centerY + obj.radius);
      } else if (obj.type === 'line') {
        minX = Math.min(minX, obj.x);
        minY = Math.min(minY, obj.y);
        maxX = Math.max(maxX, obj.x + obj.width);
        maxY = Math.max(maxY, obj.y);
      } else if (obj.type === 'text') {
        minX = Math.min(minX, obj.x);
        minY = Math.min(minY, obj.y);
        // Approximate text bounds
        const textWidth = obj.text.length * obj.fontSize * 0.6;
        const textHeight = obj.fontSize * 1.2;
        maxX = Math.max(maxX, obj.x + textWidth);
        maxY = Math.max(maxY, obj.y + textHeight);
      }
    });
    
    const groupCenterX = (minX + maxX) / 2;
    const groupCenterY = (minY + maxY) / 2;
    
    // Calculate offset to paste at viewport center
    // If viewportCenter is provided, use it; otherwise use incremental offset (fallback)
    let offsetX: number, offsetY: number;
    
    if (viewportCenter) {
      // Paste at viewport center
      offsetX = viewportCenter.x - groupCenterX;
      offsetY = viewportCenter.y - groupCenterY;
    } else {
      // Fallback: incremental offset from original position
      const offset = (clipboard.pasteOffset + 1) * 20;
      offsetX = offset;
      offsetY = offset;
    }
    
    // Prepare all objects for batch creation
    const now = Date.now();
    const objectsRef = ref(database, `objects/${canvasId}`);
    const newShapes: Shape[] = [];
    const firebaseUpdates: Record<string, any> = {};
    const newIds: string[] = [];
    
    // Clone and prepare all objects with calculated offset
    for (const obj of clipboard.objects) {
      const newObjectRef = push(objectsRef);
      const newId = newObjectRef.key;
      if (!newId) continue;
      
      let newObject: Shape;
      
      // Clone based on shape type and apply offset
      if (obj.type === 'rectangle') {
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + offsetX,
          y: obj.y + offsetY,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else if (obj.type === 'circle') {
        newObject = {
          ...obj,
          id: newId,
          centerX: obj.centerX + offsetX,
          centerY: obj.centerY + offsetY,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else if (obj.type === 'line') {
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + offsetX,
          y: obj.y + offsetY,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        // text
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + offsetX,
          y: obj.y + offsetY,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      }
      
      newShapes.push(newObject);
      newIds.push(newId);
      
      // Mark this object as being created by current user (to prevent self-notifications)
      userCreatingIdsRef.current.add(newId);
      
      // Prepare Firebase update path
      firebaseUpdates[`objects/${canvasId}/${newId}`] = newObject;
    }
    
    // Single optimistic state update for all shapes (1 re-render instead of N)
    setObjects(prev => [...prev, ...newShapes]);
    
    // Single Firebase batch write for all shapes
    try {
      const { update } = await import('firebase/database');
      await update(ref(database), firebaseUpdates);
    } catch (error) {
      console.error('Error creating pasted objects:', error);
      // Rollback optimistic update on error
      const idsSet = new Set(newIds);
      setObjects(prev => prev.filter(obj => !idsSet.has(obj.id)));
      showToast('Failed to paste objects', 'error');
      return;
    }
    
    // Select pasted objects (this highlights them)
    setSelectedIds(newIds);
    
    // Increment paste offset (only used for fallback)
    setClipboard(prev => ({
      ...prev,
      pasteOffset: prev.pasteOffset + 1,
    }));
    
    showToast('Pasted', 'success');
  };

  // Cut objects (copy then delete)
  const handleCut = async () => {
    if (selectedIds.length === 0) return;
    
    // Copy to clipboard
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    setClipboard({
      objects: selectedObjects,
      pasteOffset: 0,
    });
    
    // Delete selected objects
    await deleteSelected();
  };

  // Duplicate objects with fixed offset
  const handleDuplicate = async () => {
    if (selectedIds.length === 0 || !user) return;
    
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    const DUPLICATE_OFFSET = 50; // Fixed offset
    
    // Prepare all objects for batch creation
    const now = Date.now();
    const objectsRef = ref(database, `objects/${canvasId}`);
    const newShapes: Shape[] = [];
    const firebaseUpdates: Record<string, any> = {};
    const newIds: string[] = [];
    
    // Clone and prepare all objects with fixed offset
    for (const obj of selectedObjects) {
      const newObjectRef = push(objectsRef);
      const newId = newObjectRef.key;
      if (!newId) continue;
      
      let newObject: Shape;
      
      // Clone based on shape type and apply offset
      if (obj.type === 'rectangle') {
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + DUPLICATE_OFFSET,
          y: obj.y + DUPLICATE_OFFSET,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else if (obj.type === 'circle') {
        newObject = {
          ...obj,
          id: newId,
          centerX: obj.centerX + DUPLICATE_OFFSET,
          centerY: obj.centerY + DUPLICATE_OFFSET,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else if (obj.type === 'line') {
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + DUPLICATE_OFFSET,
          y: obj.y + DUPLICATE_OFFSET,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        // text
        newObject = {
          ...obj,
          id: newId,
          x: obj.x + DUPLICATE_OFFSET,
          y: obj.y + DUPLICATE_OFFSET,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        };
      }
      
      newShapes.push(newObject);
      newIds.push(newId);
      
      // Mark this object as being created by current user (to prevent self-notifications)
      userCreatingIdsRef.current.add(newId);
      
      // Prepare Firebase update path
      firebaseUpdates[`objects/${canvasId}/${newId}`] = newObject;
    }
    
    // Single optimistic state update for all shapes (1 re-render instead of N)
    setObjects(prev => [...prev, ...newShapes]);
    
    // Single Firebase batch write for all shapes
    try {
      const { update } = await import('firebase/database');
      await update(ref(database), firebaseUpdates);
    } catch (error) {
      console.error('Error creating duplicated objects:', error);
      // Rollback optimistic update on error
      const idsSet = new Set(newIds);
      setObjects(prev => prev.filter(obj => !idsSet.has(obj.id)));
      showToast('Failed to duplicate objects', 'error');
      return;
    }
    
    // Select duplicated objects
    setSelectedIds(newIds);
    
    showToast('Duplicated', 'success');
  };

  const contextValue: CanvasContextType = {
    objects,
    selectedIds,
    isLoading,
    mode,
    undoState,
    redoState,
    setMode,
    createObject,
    createObjectsBatch,
    updateObject,
    updateObjectsBatch,
    deleteObject,
    selectObject,
    selectMultiple,
    clearSelection,
    deleteSelected,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    undo,
    redo,
    captureUndoSnapshot,
    clearUndo,
    setDisableUndoCapture,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

