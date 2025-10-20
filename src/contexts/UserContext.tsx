import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../types';
import { STANDARD_COLORS } from '../utils/colors';
import { getUserProfile, createUserProfile, updateUserProfile } from '../utils/firebase';

// Create context
export const UserContext = createContext<AuthContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const auth = useAuth();
  const [userColor, setUserColor] = useState<string>('');

  // Load or create user profile from Firebase when they authenticate
  useEffect(() => {
    const initializeUserProfile = async () => {
      if (auth.isAuthenticated && auth.user) {
        try {
          // Check if user profile exists in Firebase
          const userProfile = await getUserProfile(auth.user.uid);
          
          if (userProfile && userProfile.color) {
            // Existing user - load color from Firebase
            console.log('Loading existing user color from Firebase:', userProfile.color);
            setUserColor(userProfile.color);
            
            // Update lastSeenAt
            await updateUserProfile(auth.user.uid, {});
          } else {
            // New user - assign random color and create profile
            const randomColor = STANDARD_COLORS[Math.floor(Math.random() * STANDARD_COLORS.length)];
            console.log('Creating new user profile with color:', randomColor);
            setUserColor(randomColor);
            
            await createUserProfile(
              auth.user.uid,
              auth.user.email || 'unknown@example.com',
              randomColor
            );
          }
        } catch (error) {
          console.error('Error initializing user profile:', error);
          // Fallback to random color if Firebase fails
          const fallbackColor = STANDARD_COLORS[Math.floor(Math.random() * STANDARD_COLORS.length)];
          setUserColor(fallbackColor);
        }
      } else if (!auth.isAuthenticated) {
        // Clear color when user logs out
        setUserColor('');
      }
    };

    initializeUserProfile();
  }, [auth.isAuthenticated, auth.user]);

  // Function to change user color
  const changeUserColor = async (newColor: string) => {
    if (STANDARD_COLORS.includes(newColor) && auth.user) {
      setUserColor(newColor);
      
      try {
        // Update color in Firebase user profile
        await updateUserProfile(auth.user.uid, { color: newColor });
        console.log('User color updated in Firebase:', newColor);
      } catch (error) {
        console.error('Error updating user color in Firebase:', error);
      }
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

