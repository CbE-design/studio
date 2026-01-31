
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Functions region
const functionsRegion = 'us-central1';

// Lazy initialization functions to prevent SSR issues
let _app: FirebaseApp | null = null;
let _firestore: Firestore | null = null;
let _auth: Auth | null = null;
let _functions: Functions | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    // Return a minimal app during SSR - don't initialize auth
    if (!getApps().length) {
      return initializeApp(firebaseConfig);
    }
    return getApp();
  }
  
  if (!_app) {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
}

function getFirebaseFirestore(): Firestore {
  if (!_firestore) {
    _firestore = getFirestore(getFirebaseApp());
  }
  return _firestore;
}

function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available on the client side');
  }
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

function getFirebaseFunctions(): Functions {
  if (!_functions) {
    _functions = getFunctions(getFirebaseApp(), functionsRegion);
  }
  return _functions;
}

// Export getter functions for lazy initialization
export const app = typeof window !== 'undefined' ? getFirebaseApp() : null;
export const firestore = typeof window !== 'undefined' ? getFirebaseFirestore() : null;
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null;
export const functions = typeof window !== 'undefined' ? getFirebaseFunctions() : null;

// Export getter functions for use in components
export { getFirebaseApp, getFirebaseFirestore, getFirebaseAuth, getFirebaseFunctions };
