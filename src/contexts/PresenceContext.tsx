import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';
import type { PresenceUser, CursorPosition, PresenceContextType } from '../types';

// Create the context
export const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceContextProviderProps {
  children: ReactNode;
}

export const PresenceContextProvider = ({ children }: PresenceContextProviderProps) => {
  const authContext = useContext(UserContext);
  const onlineUsers = new Map<string, PresenceUser>(); // Will be implemented in PR #11
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());

  // Update cursor position (local state only - Firebase integration in PR #10)
  const updateCursor = (position: { x: number; y: number }) => {
    if (!authContext?.user) {
      return;
    }

    const cursorData: CursorPosition = {
      x: position.x,
      y: position.y,
      email: authContext.user.email || 'Unknown',
      timestamp: Date.now(),
    };

    setCursors((prev) => {
      const newCursors = new Map(prev);
      newCursors.set(authContext.user!.uid, cursorData);
      return newCursors;
    });
  };

  const contextValue: PresenceContextType = {
    onlineUsers,
    cursors,
    updateCursor,
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
};

