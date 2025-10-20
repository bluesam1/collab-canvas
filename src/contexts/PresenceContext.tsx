import { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';
import type { PresenceUser, CursorPosition, PresenceContextType } from '../types';
import { subscribeToPresence, updateCursor as updateCursorFirebase, setUserPresence, updateUserPresence } from '../utils/firebase';
import { useNotification } from '../hooks/useNotification';

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
  const { addNotification } = useNotification();
  
  // Throttle state for cursor updates
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const THROTTLE_INTERVAL = 50; // 50ms throttle
  
  // Keep track of user order for color assignment
  const userOrderRef = useRef<string[]>([]);
  
  // Track previous online users for detecting joins/leaves
  const previousOnlineUsersRef = useRef<Map<string, PresenceUser>>(new Map());

  // Subscribe to Firebase presence updates for online users and cursors
  useEffect(() => {
    const CURSOR_TIMEOUT = 30000; // 30 seconds
    
    const unsubscribe = subscribeToPresence(canvasId, (presenceData) => {
      console.log('📡 Presence data received:', presenceData);
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
          // Use the color from the user's presence data
          const color = user.color || '#3B82F6';
          
          newOnlineUsers.set(userId, {
            uid: userId,
            email: user.email || 'Unknown',
            color: color,
            isOnline: true,
            lastActive: user.lastActive || now,
          });
        }
        
        // Add cursor if it exists, user is not the current user, AND user is online
        if (user.cursor && userId !== authContext?.user?.uid && user.isOnline === true) {
          const cursorTimestamp = user.cursor.timestamp || 0;
          const timeSinceUpdate = now - cursorTimestamp;
          
          // Only show cursor if it was updated within the last 30 seconds AND user is online
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
      
      
      console.log(`👥 Found ${newOnlineUsers.size} online users:`, Array.from(newOnlineUsers.entries()).map(([id, user]) => ({ id, email: user.email })));
      console.log(`🖱️ Found ${newCursors.size} cursors`);
      
      // Detect user joins/leaves for notifications (only after initial load)
      if (previousOnlineUsersRef.current.size > 0 && authContext?.user) {
        const currentUserId = authContext.user.uid;
        
        // Detect new users (joined)
        newOnlineUsers.forEach((user, userId) => {
          if (!previousOnlineUsersRef.current.has(userId) && userId !== currentUserId) {
            // User just joined
            addNotification({
              type: 'user-join',
              userEmail: user.email,
              userColor: user.color,
              message: 'joined the canvas',
            });
          }
        });
        
        // Detect users who left
        previousOnlineUsersRef.current.forEach((user, userId) => {
          if (!newOnlineUsers.has(userId) && userId !== currentUserId) {
            // User just left
            addNotification({
              type: 'user-leave',
              userEmail: user.email,
              userColor: user.color,
              message: 'left the canvas',
            });
          }
        });
      }
      
      // Update previous online users for next comparison
      previousOnlineUsersRef.current = new Map(newOnlineUsers);
      
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
      console.log('👤 Presence: No user or not authenticated');
      return;
    }

    const user = authContext.user;
    
    console.log('👤 Setting user presence:', {
      canvasId,
      userId: user.uid,
      email: user.email,
      color: user.color
    });
    
    // Set user presence in Firebase for this canvas
    setUserPresence(canvasId, user.uid, {
      email: user.email || 'Unknown',
      color: user.color || '#3B82F6',
    }).then(() => {
      console.log('✅ User presence set successfully!');
    }).catch((error) => {
      console.error('❌ Error setting user presence:', error);
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

  // Update presence color when user changes their color
  useEffect(() => {
    if (!authContext?.user || !authContext.isAuthenticated) {
      return;
    }

    const user = authContext.user;
    
    // Update color in Firebase presence
    updateUserPresence(canvasId, user.uid, {
      color: user.color || '#3B82F6',
    }).catch((error) => {
      console.debug('Error updating color:', error);
    });
  }, [authContext?.user?.color, authContext?.isAuthenticated, canvasId]);

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

