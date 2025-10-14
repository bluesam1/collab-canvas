import { useContext } from 'react';
import { PresenceContext } from '../contexts/PresenceContext';

/**
 * Custom hook to use the PresenceContext
 * @throws Error if used outside of PresenceContextProvider
 * @returns PresenceContextType
 */
export const usePresence = () => {
  const context = useContext(PresenceContext);
  
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceContextProvider');
  }
  
  return context;
};

