import { useCanvasList as useCanvasListContext } from '../contexts/CanvasListContext';

/**
 * Hook to access canvas list functionality
 * @returns CanvasListContextType - The canvas list context
 * @throws Error if used outside CanvasListProvider
 */
export function useCanvasList() {
  return useCanvasListContext();
}
