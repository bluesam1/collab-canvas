import { useState, useEffect } from 'react';
import {
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  isSignInWithEmailLink,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import type { User, AuthState } from '../types';

// Key for storing email in localStorage
const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Action settings for email link
  const actionCodeSettings = {
    url: window.location.origin, // Return to the same page
    handleCodeInApp: true,
  };

  // Convert Firebase User to our User type
  const convertFirebaseUser = (firebaseUser: any): User => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  });

  // Send email link for passwordless sign-in
  const sendEmailLink = async (email: string): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save email to localStorage for completing sign-in
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
      
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Error sending email link:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to send sign-in link. Please try again.',
      }));
      throw error;
    }
  };

  // Sign in with Google popup
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // Auth state will be updated by onAuthStateChanged listener
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Handle user cancellation gracefully
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setAuthState((prev) => ({ ...prev, isLoading: false, error: null }));
        return;
      }
      
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign in with Google. Please try again.',
      }));
      throw error;
    }
  };

  // Log out
  const logout = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      await signOut(auth);
      
      // Clear stored email
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign out. Please try again.',
      }));
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  // Check if user is completing email link sign-in
  useEffect(() => {
    const completeEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        
        if (!email) {
          // Prompt user for email if not found
          email = window.prompt('Please provide your email for confirmation');
        }
        
        if (email) {
          try {
            setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
            
            await signInWithEmailLink(auth, email, window.location.href);
            
            // Clear email from storage
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
            
            // Clean up the URL
            window.history.replaceState(null, '', window.location.pathname);
            
            setAuthState((prev) => ({ ...prev, isLoading: false }));
          } catch (error: any) {
            console.error('Error completing email link sign-in:', error);
            setAuthState((prev) => ({
              ...prev,
              isLoading: false,
              error: error.message || 'Failed to complete sign-in. Please try again.',
            }));
          }
        }
      }
    };
    
    completeEmailLinkSignIn();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const user = convertFirebaseUser(firebaseUser);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message || 'Authentication error occurred.',
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    sendEmailLink,
    signInWithGoogle,
    logout,
    clearError,
  };
};

