import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

// Firebase configuration (hard-coded for now since there's an issue with the format)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "domyjob-ai.firebaseapp.com", // Use standard format
  projectId: "domyjob-ai", // Extract just the project ID
  storageBucket: "domyjob-ai.appspot.com",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// For debugging
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '[REDACTED]' : 'missing',
  authDomain: "domyjob-ai.firebaseapp.com",
  projectId: "domyjob-ai",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? '[REDACTED]' : 'missing',
});

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Provider instances
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers with additional scopes for email access
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

appleProvider.addScope('email');
appleProvider.addScope('name');

// Auth functions for Google sign-in
export const signInWithGoogle = async () => {
  try {
    // Using redirect method instead of popup for better compatibility
    await signInWithRedirect(auth, googleProvider);
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: error.message || "Failed to sign in with Google"
    };
  }
};

// Auth functions for Apple sign-in
export const signInWithApple = async () => {
  try {
    // Using redirect method instead of popup for better compatibility
    await signInWithRedirect(auth, appleProvider);
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Apple sign-in error:", error);
    return {
      success: false,
      error: error.message || "Failed to sign in with Apple"
    };
  }
};

// Types for auth results
export interface AuthSuccess {
  success: true;
  user: FirebaseUser;
  provider: string;
}

export interface AuthError {
  success: false;
  error: string;
}

export interface AuthEmpty {
  success: false;
}

export type AuthResult = AuthSuccess | AuthError | AuthEmpty;

// Function to get the result of the redirect sign-in
export const getAuthRedirectResult = async (): Promise<AuthResult> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User is signed in
      return {
        success: true,
        user: result.user,
        provider: result.providerId || 'unknown'
      };
    }
    return { success: false };
  } catch (error: any) {
    console.error("Auth redirect result error:", error);
    return {
      success: false,
      error: error.message || "Failed to get authentication result"
    };
  }
};

// Sign out function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to sign out"
    };
  }
};

// Export auth and providers for use in components
export { auth, googleProvider, appleProvider };