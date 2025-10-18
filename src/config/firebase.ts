import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Realtime Database
export const database = getDatabase(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV) {
  console.log('🔍 DEV mode detected');
  console.log('🔍 VITE_USE_FUNCTIONS_EMULATOR:', import.meta.env.VITE_USE_FUNCTIONS_EMULATOR);
  
  // Only connect to Functions emulator for AI testing
  // Auth and Database use production (emulator auth would require separate user accounts)
  if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('✅ Using Functions Emulator (localhost:5001)');
  } else {
    console.log('❌ NOT using Functions Emulator - calling production');
    console.log('   To use emulator: Set VITE_USE_FUNCTIONS_EMULATOR=true in .env');
  }
}

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

// Export the app instance
export default app;


