import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Capture BEFORE we call initializeApp so we know if this is a fresh start
const isFirstInit = getApps().length === 0;

const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

let auth;
if (isFirstInit) {
  try {
    // Try with AsyncStorage persistence first (sessions survive app restart)
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fall back to in-memory if AsyncStorage persistence fails
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} else {
  // App already initialized — auth was already registered, just retrieve it
  auth = getAuth(app);
}

const firestore = getFirestore(app);

export { app, auth, firestore };
