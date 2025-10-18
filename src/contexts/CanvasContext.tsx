import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Shape, CanvasContextType, CanvasMode, Rectangle, Circle, Line, Text, UndoState, UndoOperationType } from '../types';
import { 
  subscribeToObjects, 
  updateObject as updateFirebaseObject,
  deleteObject as deleteFirebaseObject
} from '../utils/firebase';
import { ref, push, set } from 'firebase/database';
import { database } from '../config/firebase';

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
  const [performanceMode, setPerformanceMode] = useState(true); // Performance mode toggle (on by default)

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

      setObjects(objectsArray);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId]);

  // Undo helper functions
  const captureUndoSnapshot = (operation: UndoOperationType, affectedIds: string[]) => {
    // Skip if undo capture is disabled (e.g., during AI batch operations)
    if (disableUndoCapture) {
      return;
    }
    
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

  // Create a new object with Firebase integration
  const createObject = async (objectData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Line, 'id' | 'createdAt' | 'updatedAt'> | Omit<Text, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
          ? { ...obj, ...updates, updatedAt: now } as Shape
          : obj
      )
    );

    // Write to Firebase
    try {
      await updateFirebaseObject(canvasId, id, {
        ...updates,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error updating object in Firebase:', error);
      // Note: Firebase listener will revert to correct state
    }
  };

  // Delete an object with Firebase integration
  // Delete one or multiple objects
  const deleteObject = async (ids: string | string[]) => {
    // Normalize to array
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    
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

  const contextValue: CanvasContextType = {
    objects,
    selectedIds,
    isLoading,
    mode,
    undoState,
    performanceMode,
    setMode,
    setPerformanceMode,
    createObject,
    createObjectsBatch,
    updateObject,
    deleteObject,
    selectObject,
    selectMultiple,
    clearSelection,
    deleteSelected,
    undo,
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

