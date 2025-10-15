import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getUserCanvases, 
  searchUserCanvases, 
  createCanvas, 
  deleteCanvas, 
  renameCanvas, 
  leaveCanvas 
} from '../utils/canvases';
import { type CanvasListItem } from '../types';

interface CanvasListContextType {
  canvases: CanvasListItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createNewCanvas: (name: string) => Promise<string>;
  deleteCanvasById: (canvasId: string) => Promise<boolean>;
  renameCanvasById: (canvasId: string, newName: string) => Promise<boolean>;
  leaveCanvasById: (canvasId: string) => Promise<boolean>;
  refreshCanvases: () => Promise<void>;
}

const CanvasListContext = createContext<CanvasListContextType | undefined>(undefined);

interface CanvasListProviderProps {
  children: ReactNode;
}

export function CanvasListProvider({ children }: CanvasListProviderProps) {
  const { user } = useAuth();
  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCanvases, setFilteredCanvases] = useState<CanvasListItem[]>([]);

  // Load canvases when user changes
  const loadCanvases = useCallback(async () => {
    if (!user) {
      setCanvases([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userCanvases = await getUserCanvases(user.uid);
      setCanvases(userCanvases);
    } catch (error) {
      console.error('Failed to load canvases:', error);
      setCanvases([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Search canvases with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!user) {
        setFilteredCanvases([]);
        return;
      }

      if (searchQuery.trim()) {
        try {
          const searchResults = await searchUserCanvases(user.uid, searchQuery);
          setFilteredCanvases(searchResults);
        } catch (error) {
          console.error('Failed to search canvases:', error);
          setFilteredCanvases([]);
        }
      } else {
        setFilteredCanvases(canvases);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, canvases, user]);

  // Load canvases on mount and user change
  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  const createNewCanvas = useCallback(async (name: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const canvasId = await createCanvas(name, user.uid);
    await loadCanvases(); // Refresh the list
    return canvasId;
  }, [user, loadCanvases]);

  const deleteCanvasById = useCallback(async (canvasId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const success = await deleteCanvas(canvasId, user.uid);
    if (success) {
      await loadCanvases(); // Refresh the list
    }
    return success;
  }, [user, loadCanvases]);

  const renameCanvasById = useCallback(async (canvasId: string, newName: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const success = await renameCanvas(canvasId, newName, user.uid);
    if (success) {
      await loadCanvases(); // Refresh the list
    }
    return success;
  }, [user, loadCanvases]);

  const leaveCanvasById = useCallback(async (canvasId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const success = await leaveCanvas(canvasId, user.uid);
    if (success) {
      await loadCanvases(); // Refresh the list
    }
    return success;
  }, [user, loadCanvases]);

  const refreshCanvases = useCallback(async () => {
    await loadCanvases();
  }, [loadCanvases]);

  const contextValue: CanvasListContextType = {
    canvases: searchQuery.trim() ? filteredCanvases : canvases,
    isLoading,
    searchQuery,
    setSearchQuery,
    createNewCanvas,
    deleteCanvasById,
    renameCanvasById,
    leaveCanvasById,
    refreshCanvases,
  };

  return (
    <CanvasListContext.Provider value={contextValue}>
      {children}
    </CanvasListContext.Provider>
  );
}

export function useCanvasList() {
  const context = useContext(CanvasListContext);
  if (context === undefined) {
    throw new Error('useCanvasList must be used within a CanvasListProvider');
  }
  return context;
}
