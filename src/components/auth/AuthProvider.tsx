import { useContext, ReactNode } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Login } from './Login';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const authContext = useContext(UserContext);

  if (!authContext) {
    throw new Error('AuthProvider must be used within UserContextProvider');
  }

  const { isAuthenticated, isLoading } = authContext;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show app if authenticated
  return <>{children}</>;
};

