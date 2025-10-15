import { useToast as useToastContext } from '../contexts/ToastContext';

/**
 * Hook to access toast notification functionality
 * @returns ToastContextType - The toast context
 * @throws Error if used outside ToastProvider
 */
export function useToast() {
  return useToastContext();
}
