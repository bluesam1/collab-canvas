import { useContext, useState } from 'react';
import { UserContextProvider, UserContext } from './contexts/UserContext';
import { CanvasContextProvider } from './contexts/CanvasContext';
import { PresenceContextProvider } from './contexts/PresenceContext';
import { AuthProvider } from './components/auth/AuthProvider';
import { Canvas } from './components/canvas/Canvas';
import { Toolbar } from './components/toolbar/Toolbar';
import './App.css';

// Main authenticated app content
function AuthenticatedApp() {
  const authContext = useContext(UserContext);
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue

  if (!authContext || !authContext.user) {
    return null;
  }

  const { user, logout } = authContext;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header with user info and logout button */}
      <header className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>
            <p className="text-xs text-gray-600">
              Signed in as <strong>{user.email}</strong>
              {user.color && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }}></span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Toolbar - positioned in top-left */}
      <Toolbar selectedColor={selectedColor} onColorChange={setSelectedColor} />

      {/* Canvas - full screen */}
      <Canvas selectedColor={selectedColor} />
    </div>
  );
}

// Root App component
function App() {
  return (
    <UserContextProvider>
      <AuthProvider>
        <CanvasContextProvider>
          <PresenceContextProvider>
            <AuthenticatedApp />
          </PresenceContextProvider>
        </CanvasContextProvider>
      </AuthProvider>
    </UserContextProvider>
  );
}

export default App;
