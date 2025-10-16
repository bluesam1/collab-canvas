import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Shape, CanvasContextType, CanvasMode, Rectangle, Circle, Line, Text } from '../types';
import { 
  subscribeToObjects, 
  createObject as createFirebaseObject,
  updateObject as updateFirebaseObject,
  deleteObject as deleteFirebaseObject
} from '../utils/firebase';
import { ref, push } from 'firebase/database';
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

  // Create a new object with Firebase integration
  const createObject = async (objectData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> | Omit<Line, 'id' | 'createdAt' | 'updatedAt'> | Omit<Text, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate a unique ID using Firebase push
    const objectsRef = ref(database, `objects/${canvasId}`);
    const newObjectRef = push(objectsRef);
    const objectId = newObjectRef.key;

    if (!objectId) {
      console.error('Failed to generate object ID');
      return;
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

    // Write to Firebase
    try {
      await createFirebaseObject(canvasId, {
        ...objectData,
        id: objectId,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error creating object in Firebase:', error);
      // Rollback optimistic update on error
      setObjects((prev) => prev.filter((obj) => obj.id !== objectId));
    }
  };

  // Update an existing object with Firebase integration
  const updateObject = async (id: string, updates: Partial<Shape>) => {
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
  const deleteObject = async (id: string) => {
    // Optimistic update: remove from local state immediately
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    
    // Clear selection if the deleted object was selected
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

    // Remove from Firebase
    try {
      await deleteFirebaseObject(canvasId, id);
    } catch (error) {
      console.error('Error deleting object from Firebase:', error);
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
    setMode,
    createObject,
    updateObject,
    deleteObject,
    selectObject,
    selectMultiple,
    clearSelection,
    deleteSelected,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

