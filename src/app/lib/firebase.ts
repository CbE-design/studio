
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Initialize Functions with region
const functionsRegion = 'us-central1';
const functions: Functions = getFunctions(app, functionsRegion);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
    try {
        console.log("Connecting to Firebase Functions emulator...");
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log("Successfully connected to Functions emulator.");
    } catch (e) {
        console.error("Error connecting to Functions emulator:", e);
    }
}


export { app, firestore, auth, functions };
