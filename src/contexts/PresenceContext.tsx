import { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';
import type { PresenceUser, CursorPosition, PresenceContextType } from '../types';
import { subscribeToPresence, updateCursor as updateCursorFirebase, setUserPresence, updateUserPresence } from '../utils/firebase';
import { getUserColor } from '../utils/colors';

// Create the context
export const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceContextProviderProps {
  children: ReactNode;
  canvasId: string;
}

export const PresenceContextProvider = ({ children, canvasId }: PresenceContextProviderProps) => {
  const authContext = useContext(UserContext);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  
  // Throttle state for cursor updates
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const THROTTLE_INTERVAL = 50; // 50ms throttle
  
  // Keep track of user order for color assignment
  const userOrderRef = useRef<string[]>([]);

  // Subscribe to Firebase presence updates for online users and cursors
  useEffect(() => {
    const CURSOR_TIMEOUT = 30000; // 30 seconds
    
    const unsubscribe = subscribeToPresence(canvasId, (presenceData) => {
      const now = Date.now();
      const newOnlineUsers = new Map<string, PresenceUser>();
      const newCursors = new Map<string, CursorPosition>();
      
      // Get list of online user IDs sorted by join time
      const onlineUserIds = Object.entries(presenceData)
        .filter(([_, userData]) => {
          const user = userData as any;
          return user.isOnline === true;
        })
        .sort((a, b) => {
          const timeA = (a[1] as any).lastActive || 0;
          const timeB = (b[1] as any).lastActive || 0;
          return timeA - timeB;
        })
        .map(([userId]) => userId);
      
      // Update user order for consistent color assignment
      userOrderRef.current = onlineUserIds;
      
      // Process presence data and extract online users and cursor positions
      Object.entries(presenceData).forEach(([userId, userData]) => {
        const user = userData as any;
        
        // Add to online users if they are online
        if (user.isOnline === true) {
          // Assign color based on order of arrival (cycling through 5 colors)
          const userIndex = userOrderRef.current.indexOf(userId);
          const color = getUserColor(userIndex);
          
          newOnlineUsers.set(userId, {
            uid: userId,
            email: user.email || 'Unknown',
            color: color,
            isOnline: true,
            lastActive: user.lastActive || now,
          });
        }
        
        // Add cursor if it exists and user is not the current user
        if (user.cursor && userId !== authContext?.user?.uid) {
          const cursorTimestamp = user.cursor.timestamp || 0;
          const timeSinceUpdate = now - cursorTimestamp;
          
          // Only show cursor if it was updated within the last 30 seconds
          if (timeSinceUpdate < CURSOR_TIMEOUT) {
            // Get color from online users map if available
            const userColor = newOnlineUsers.get(userId)?.color || user.cursor.color || user.color || '#3B82F6';
            
            newCursors.set(userId, {
              x: user.cursor.x,
              y: user.cursor.y,
              email: user.cursor.email || user.email || 'Unknown',
              color: userColor,
              timestamp: cursorTimestamp,
            });
          }
        }
      });
      
      
      setOnlineUsers(newOnlineUsers);
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
  }, [authContext?.user?.uid, canvasId]);

  // Set user presence when they log in
  useEffect(() => {
    if (!authContext?.user || !authContext.isAuthenticated) {
      return;
    }

    const user = authContext.user;
    
    // Set user presence in Firebase for this canvas
    setUserPresence(canvasId, user.uid, {
      email: user.email || 'Unknown',
      color: user.color || '#3B82F6',
    }).catch((error) => {
      console.error('Error setting user presence:', error);
    });

    // Update lastActive timestamp periodically (every 30 seconds)
    const updateInterval = setInterval(() => {
      if (authContext?.user) {
        updateUserPresence(canvasId, authContext.user.uid, {
          // Just updates the lastActive timestamp
        }).catch((error) => {
          console.debug('Error updating presence:', error);
        });
      }
    }, 30000);

    // Cleanup on unmount or logout
    return () => {
      clearInterval(updateInterval);
    };
  }, [authContext?.user, authContext?.isAuthenticated]);

  // Update cursor position with throttling (trailing edge)
  const updateCursor = (position: { x: number; y: number }) => {
    if (!authContext?.user) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Get user's color from onlineUsers if available
    const userColor = onlineUsers.get(authContext.user.uid)?.color || authContext.user.color || '#3B82F6';

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      lastUpdateTimeRef.current = now;
      updateCursorFirebase(canvasId, authContext.user.uid, {
        x: position.x,
        y: position.y,
        email: authContext.user.email || 'Unknown',
        color: userColor,
      }).catch((error) => {
        console.debug('Error updating cursor:', error);
      });
    } else {
      // Otherwise, schedule an update (trailing edge)
      pendingUpdateRef.current = position;
      updateTimeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current && authContext?.user) {
          lastUpdateTimeRef.current = Date.now();
          const color = onlineUsers.get(authContext.user.uid)?.color || authContext.user.color || '#3B82F6';
          updateCursorFirebase(canvasId, authContext.user.uid, {
            x: pendingUpdateRef.current.x,
            y: pendingUpdateRef.current.y,
            email: authContext.user.email || 'Unknown',
            color: color,
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

