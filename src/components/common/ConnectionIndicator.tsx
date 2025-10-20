import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '../../hooks/useConnection';

export function ConnectionIndicator() {
  const { connectionState, manualReconnect } = useConnection();
  const { status } = connectionState;

  const isConnected = status === 'connected';

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-lg shadow-lg transition-opacity ${
        isConnected 
          ? 'opacity-50 border-green-200' 
          : 'opacity-100 border-red-200'
      }`}
    >
      {/* Icon */}
      {isConnected ? (
        <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : (
        <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
      )}
      
      {/* Status Text */}
      <span className={`text-sm font-medium ${
        isConnected ? 'text-green-700' : 'text-red-700'
      }`}>
        {isConnected ? 'Connected.' : 'Disconnected.'}
      </span>

      {/* Reconnect Button - only show when disconnected */}
      {!isConnected && (
        <button
          onClick={manualReconnect}
          className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
