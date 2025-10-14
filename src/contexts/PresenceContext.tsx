import { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';
import type { PresenceUser, CursorPosition, PresenceContextType } from '../types';
import { subscribeToPresence, updateCursor as updateCursorFirebase } from '../utils/firebase';

// Create the context
export const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceContextProviderProps {
  children: ReactNode;
}

export const PresenceContextProvider = ({ children }: PresenceContextProviderProps) => {
  const authContext = useContext(UserContext);
  const onlineUsers = new Map<string, PresenceUser>(); // Will be implemented in PR #11
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  
  // Throttle state for cursor updates
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const THROTTLE_INTERVAL = 50; // 50ms throttle

  // Subscribe to Firebase presence updates for all cursors
  useEffect(() => {
    const CURSOR_TIMEOUT = 30000; // 30 seconds
    
    const unsubscribe = subscribeToPresence((presenceData) => {
      const now = Date.now();
      const newCursors = new Map<string, CursorPosition>();
      
      // Process presence data and extract cursor positions
      Object.entries(presenceData).forEach(([userId, userData]) => {
        const user = userData as any;
        
        // Only add cursor if it exists and user is not the current user
        if (user.cursor && userId !== authContext?.user?.uid) {
          const cursorTimestamp = user.cursor.timestamp || 0;
          const timeSinceUpdate = now - cursorTimestamp;
          
          // Only show cursor if it was updated within the last 30 seconds
          if (timeSinceUpdate < CURSOR_TIMEOUT) {
            newCursors.set(userId, {
              x: user.cursor.x,
              y: user.cursor.y,
              email: user.cursor.email || user.email || 'Unknown',
              color: user.cursor.color || user.color || '#3B82F6',
              timestamp: cursorTimestamp,
            });
          }
        }
      });
      
      setCursors(newCursors);
    });

    // Set up interval to periodically clean up stale cursors
    const cleanupInterval = setInterval(() => {
      setCursors((prevCursors) => {
        const now = Date.now();
        const activeCursors = new Map<string, CursorPosition>();
        
        prevCursors.forEach((cursor, userId) => {
          const timeSinceUpdate = now - cursor.timestamp;
          if (timeSinceUpdate < CURSOR_TIMEOUT) {
            activeCursors.set(userId, cursor);
          }
        });
        
        return activeCursors;
      });
    }, 5000); // Check every 5 seconds

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(cleanupInterval);
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [authContext?.user?.uid]);

  // Update cursor position with throttling (trailing edge)
  const updateCursor = (position: { x: number; y: number }) => {
    if (!authContext?.user) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      lastUpdateTimeRef.current = now;
      updateCursorFirebase(authContext.user.uid, {
        x: position.x,
        y: position.y,
        email: authContext.user.email || 'Unknown',
        color: authContext.user.color || '#3B82F6',
      }).catch((error) => {
        console.debug('Error updating cursor:', error);
      });
    } else {
      // Otherwise, schedule an update (trailing edge)
      pendingUpdateRef.current = position;
      updateTimeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current && authContext?.user) {
          lastUpdateTimeRef.current = Date.now();
          updateCursorFirebase(authContext.user.uid, {
            x: pendingUpdateRef.current.x,
            y: pendingUpdateRef.current.y,
            email: authContext.user.email || 'Unknown',
            color: authContext.user.color || '#3B82F6',
          }).catch((error) => {
            console.debug('Error updating cursor:', error);
          });
          pendingUpdateRef.current = null;
        }
      }, THROTTLE_INTERVAL - timeSinceLastUpdate);
    }
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

