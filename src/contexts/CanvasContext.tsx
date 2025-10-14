import { createContext, useState, ReactNode } from 'react';
import type { Rectangle, CanvasContextType } from '../types';

// Create the context
export const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasContextProviderProps {
  children: ReactNode;
}

export const CanvasContextProvider = ({ children }: CanvasContextProviderProps) => {
  const [objects, setObjects] = useState<Rectangle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new object (local state only - Firebase integration in PR #9)
  const createObject = (objectData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newObject: Rectangle = {
      ...objectData,
      id: `rect-${now}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    setObjects((prev) => [...prev, newObject]);
  };

  // Update an existing object (local state only)
  const updateObject = (id: string, updates: Partial<Rectangle>) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, ...updates, updatedAt: Date.now() }
          : obj
      )
    );
  };

  // Delete an object (local state only)
  const deleteObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    
    // Clear selection if the deleted object was selected
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  // Select an object (single selection only)
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

