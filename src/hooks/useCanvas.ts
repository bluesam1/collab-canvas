import { useContext } from 'react';
import { CanvasContext } from '../contexts/CanvasContext';

/**
 * Custom hook to use the CanvasContext
 * @throws Error if used outside of CanvasContextProvider
 * @returns CanvasContextType
 */
export const useCanvas = () => {
  const context = useContext(CanvasContext);
  
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasContextProvider');
  }
  
  return context;
};

