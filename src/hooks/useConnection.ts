import { useConnection as useConnectionContext } from '../contexts/ConnectionContext';

/**
 * Hook to access connection state and reconnection functionality
 * @returns ConnectionContextType - The connection context
 * @throws Error if used outside ConnectionProvider
 */
export function useConnection() {
  return useConnectionContext();
}

