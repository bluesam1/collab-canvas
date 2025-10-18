import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../types';
import { STANDARD_COLORS } from '../utils/colors';

// Create context
export const UserContext = createContext<AuthContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const auth = useAuth();
  const [userColor, setUserColor] = useState<string>('');

  // Assign a random color to the user when they authenticate
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Try to load color from localStorage
      const savedColor = localStorage.getItem(`user-color-${auth.user.uid}`);
      
      if (savedColor && STANDARD_COLORS.includes(savedColor)) {
        setUserColor(savedColor);
      } else if (!userColor) {
        // First time user - assign random color and save it
        const randomColor = STANDARD_COLORS[Math.floor(Math.random() * STANDARD_COLORS.length)];
        setUserColor(randomColor);
        localStorage.setItem(`user-color-${auth.user.uid}`, randomColor);
      }
    } else if (!auth.isAuthenticated) {
      // Clear color when user logs out
      setUserColor('');
    }
  }, [auth.isAuthenticated, auth.user, userColor]);

  // Function to change user color
  const changeUserColor = (newColor: string) => {
    if (STANDARD_COLORS.includes(newColor) && auth.user) {
      setUserColor(newColor);
      localStorage.setItem(`user-color-${auth.user.uid}`, newColor);
    }
  };

  // Augment user with color
  const userWithColor = auth.user ? { ...auth.user, color: userColor } : null;

  const contextValue: AuthContextType = {
    ...auth,
    user: userWithColor,
    changeUserColor,
    availableColors: STANDARD_COLORS,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

