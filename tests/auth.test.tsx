import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { UserContextProvider } from '../src/contexts/UserContext';
import { Login } from '../src/components/auth/Login';
import { AuthProvider } from '../src/components/auth/AuthProvider';

// Mock Firebase auth
vi.mock('firebase/auth', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  };

  let authStateCallback: ((user: any) => void) | null = null;
  let currentMockUser: any = null;

  return {
    getAuth: vi.fn(() => ({
      currentUser: currentMockUser,
    })),
    sendSignInLinkToEmail: vi.fn(() => Promise.resolve()),
    signInWithEmailLink: vi.fn(() => {
      currentMockUser = mockUser;
      if (authStateCallback) {
        authStateCallback(mockUser);
      }
      return Promise.resolve({ user: mockUser });
    }),
    signInWithPopup: vi.fn(() => {
      currentMockUser = mockUser;
      if (authStateCallback) {
        authStateCallback(mockUser);
      }
      return Promise.resolve({ user: mockUser });
    }),
    signOut: vi.fn(() => {
      currentMockUser = null;
      if (authStateCallback) {
        authStateCallback(null);
      }
      return Promise.resolve();
    }),
    onAuthStateChanged: vi.fn((auth, callback) => {
      authStateCallback = callback;
      // Immediately call with current state
      setTimeout(() => callback(currentMockUser), 0);
      return vi.fn(); // unsubscribe function
    }),
    isSignInWithEmailLink: vi.fn(() => false),
    GoogleAuthProvider: vi.fn(() => ({})),
  };
});

// Mock Firebase config
vi.mock('../src/config/firebase', () => ({
  auth: {
    currentUser: null,
  },
  database: {},
}));

describe('Authentication System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Login Component', () => {
    it('should render email input and submit button', () => {
      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send login link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });

    it('should handle email input change', async () => {
      const user = userEvent.setup();
      
      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should initiate email link sign-in when form is submitted', async () => {
      const user = userEvent.setup();
      const { sendSignInLinkToEmail } = await import('firebase/auth');

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send login link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(sendSignInLinkToEmail).toHaveBeenCalled();
      });

      // Check that success message is shown
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should store email in localStorage when sending link', async () => {
      const user = userEvent.setup();

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send login link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.localStorage.getItem('emailForSignIn')).toBe('test@example.com');
      });
    });

    it('should trigger Google Sign-In when button is clicked', async () => {
      const user = userEvent.setup();
      const { signInWithPopup } = await import('firebase/auth');

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });
    });

    it('should disable submit button when email is empty', () => {
      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const submitButton = screen.getByRole('button', { name: /send login link/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during email link send', async () => {
      const user = userEvent.setup();

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send login link/i });

      await user.type(emailInput, 'test@example.com');
      
      // Click and check for loading state immediately
      fireEvent.click(submitButton);
      
      // The button text should change to "Sending..." during loading
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('AuthProvider', () => {
    it('should show login page when not authenticated', async () => {
      // Override the mock to ensure user is null (unauthenticated)
      const { onAuthStateChanged } = await import('firebase/auth');
      const mockOnAuthStateChanged = onAuthStateChanged as any;
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        // Call callback with null to simulate unauthenticated state
        setTimeout(() => callback(null), 0);
        return vi.fn(); // unsubscribe function
      });

      // The initial loading state will show first, then login page
      render(
        <UserContextProvider>
          <AuthProvider>
            <div>Authenticated Content</div>
          </AuthProvider>
        </UserContextProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show login page
      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      expect(screen.queryByText('Authenticated Content')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(
        <UserContextProvider>
          <AuthProvider>
            <div>Authenticated Content</div>
          </AuthProvider>
        </UserContextProvider>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Auth State Persistence', () => {
    it('should call onAuthStateChanged on mount', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      await waitFor(() => {
        expect(onAuthStateChanged).toHaveBeenCalled();
      });
    });

    it('should handle logout correctly', async () => {
      const user = userEvent.setup();
      const { signOut, onAuthStateChanged } = await import('firebase/auth');

      // Mock that user is authenticated
      const mockOnAuthStateChanged = onAuthStateChanged as any;
      let authCallback: any;
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        authCallback = callback;
        // Start as authenticated
        setTimeout(() => {
          callback({
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null,
          });
        }, 0);
        return vi.fn();
      });

      // Mock signOut to trigger auth state change
      const mockSignOut = signOut as any;
      mockSignOut.mockImplementation(async () => {
        if (authCallback) {
          authCallback(null);
        }
      });

      // Import App dynamically
      const AppModule = await import('../src/App');
      const App = AppModule.default;

      render(<App />);

      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when email link sending fails', async () => {
      const user = userEvent.setup();
      const { sendSignInLinkToEmail } = await import('firebase/auth');
      
      // Mock a failure
      (sendSignInLinkToEmail as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send login link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle Google Sign-In cancellation gracefully', async () => {
      const user = userEvent.setup();
      const { signInWithPopup } = await import('firebase/auth');
      
      // Mock user cancelling the popup
      (signInWithPopup as any).mockRejectedValueOnce({
        code: 'auth/popup-closed-by-user',
        message: 'Popup closed',
      });

      render(
        <UserContextProvider>
          <Login />
        </UserContextProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Should not show error for cancellation
      await waitFor(() => {
        expect(screen.queryByText(/failed to sign in/i)).not.toBeInTheDocument();
      });
    });
  });
});

