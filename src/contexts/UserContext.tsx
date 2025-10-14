import { createContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../types';

// Create context
export const UserContext = createContext<AuthContextType | undefined>(undefined);

// Color palette for users (5 colors)
const USER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
];

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const auth = useAuth();
  const [userColor, setUserColor] = useState<string>('');

  // Assign a random color to the user when they authenticate
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !userColor) {
      // For now, assign a random color. In PR #11, this will be based on order of arrival
      const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      setUserColor(randomColor);
    } else if (!auth.isAuthenticated) {
      // Clear color when user logs out
      setUserColor('');
    }
  }, [auth.isAuthenticated, auth.user, userColor]);

  // Augment user with color
  const userWithColor = auth.user ? { ...auth.user, color: userColor } : null;

  const contextValue: AuthContextType = {
    ...auth,
    user: userWithColor,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

