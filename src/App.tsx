import { useContext } from 'react';
import { UserContextProvider, UserContext } from './contexts/UserContext';
import { AuthProvider } from './components/auth/AuthProvider';
import './App.css';

// Main authenticated app content
function AuthenticatedApp() {
  const authContext = useContext(UserContext);

  if (!authContext || !authContext.user) {
    return null;
  }

  const { user, logout } = authContext;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with user info and logout button */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CollabCanvas</h1>
            <p className="text-sm text-gray-600">
              Signed in as <strong>{user.email}</strong>
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to CollabCanvas!
          </h2>
          <p className="text-gray-600 mb-6">
            You're successfully authenticated. The canvas and collaboration features
            will be added in the next PRs.
          </p>
          {user.color && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: user.color }}
              ></div>
              <span className="text-sm text-gray-700">
                Your assigned color
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Root App component
function App() {
  return (
    <UserContextProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </UserContextProvider>
  );
}

export default App;
