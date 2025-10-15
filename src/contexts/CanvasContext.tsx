import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Rectangle, CanvasContextType, CanvasMode } from '../types';
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
  const [objects, setObjects] = useState<Rectangle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<CanvasMode>('pan'); // Default to pan mode

  // Set up Firebase listener for real-time sync
  useEffect(() => {
    setIsLoading(true);

    // Subscribe to objects in Firebase for this specific canvas
    const unsubscribe = subscribeToObjects(canvasId, (data: Record<string, unknown>) => {
      // Convert Firebase object format to array
      const objectsArray: Rectangle[] = Object.entries(data).map(([id, obj]) => {
        const objectData = obj as Record<string, unknown>;
        return {
          id,
          x: objectData.x as number,
          y: objectData.y as number,
          width: objectData.width as number,
          height: objectData.height as number,
          fill: objectData.fill as string,
          createdBy: objectData.createdBy as string,
          createdAt: objectData.createdAt as number,
          updatedAt: objectData.updatedAt as number,
        };
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
  const createObject = async (objectData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate a unique ID using Firebase push
    const objectsRef = ref(database, `objects/${canvasId}`);
    const newObjectRef = push(objectsRef);
    const objectId = newObjectRef.key;

    if (!objectId) {
      console.error('Failed to generate object ID');
      return;
    }

    const now = Date.now();
    const newObject: Rectangle = {
      ...objectData,
      id: objectId,
      createdAt: now,
      updatedAt: now,
    };

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
  const updateObject = async (id: string, updates: Partial<Rectangle>) => {
    const now = Date.now();
    
    // Optimistic update: update local state immediately
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, ...updates, updatedAt: now }
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

  // Select an object (single selection only - no Firebase sync needed)
  const selectObject = (id: string | null) => {
    if (id === null) {
      setSelectedIds([]);
    } else {
      setSelectedIds([id]);
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
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

