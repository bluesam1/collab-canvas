import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { ConnectionState, ConnectionContextType, ConnectionStatus } from '../types';
import { subscribeToConnection } from '../utils/firebase';
import { useToast } from '../hooks/useToast';

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connected',
    reconnectAttempts: 0,
    lastConnected: Date.now(),
    lastDisconnected: null,
    isConnected: true,
  });

  const { showToast, showError } = useToast();
  const wasDisconnectedRef = useRef(false);
  const isInitialMountRef = useRef(true); // Track initial mount to prevent toast spam

  // Update connection status
  const updateStatus = useCallback((status: ConnectionStatus, isConnected: boolean) => {
    setConnectionState(prev => ({
      ...prev,
      status,
      isConnected,
      lastConnected: isConnected ? Date.now() : prev.lastConnected,
      lastDisconnected: !isConnected ? Date.now() : prev.lastDisconnected,
    }));
  }, []);

  // Manual reconnect function - Firebase handles reconnection automatically
  const manualReconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested - Firebase will auto-reconnect when network is available');
  }, []);

  // Subscribe to Firebase connection state
  useEffect(() => {
    console.log('🔧 Setting up Firebase connection monitoring');
    
    // Add a small delay to allow initial connection to stabilize
    const initTimer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 1000); // Wait 1 second before enabling notifications

    const unsubscribe = subscribeToConnection(
      // On connected
      () => {
        console.log('🔥 Firebase: CONNECTED');
        
        const wasDisconnected = wasDisconnectedRef.current;
        const isInitialMount = isInitialMountRef.current;
        
        updateStatus('connected', true);
        
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          isConnected: true,
          reconnectAttempts: 0,
          lastConnected: Date.now(),
        }));

        // Show toast only if this was a reconnection (not initial page load)
        if (wasDisconnected && !isInitialMount) {
          showToast('Reconnected! Your changes are syncing...', 'success', 3000);
        }
        
        wasDisconnectedRef.current = false;
      },
      // On disconnected
      () => {
        console.log('🔥 Firebase: DISCONNECTED');
        const isInitialMount = isInitialMountRef.current;
        
        wasDisconnectedRef.current = true;
        updateStatus('disconnected', false);
        
        setConnectionState(prev => ({
          ...prev,
          status: 'disconnected',
          isConnected: false,
          reconnectAttempts: 0,
          lastDisconnected: Date.now(),
        }));

        // Show disconnect notification only if not initial page load
        if (!isInitialMount) {
          showError('Connection lost.', 5000);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      console.log('🔧 Cleaning up Firebase connection monitoring');
      clearTimeout(initTimer);
      unsubscribe();
    };
  }, [updateStatus, showToast, showError]);

  const contextValue: ConnectionContextType = {
    connectionState,
    manualReconnect,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}
