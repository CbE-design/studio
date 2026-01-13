
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
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
        console.log("Connecting to Firebase emulators...");
        connectFirestoreEmulator(firestore, '0.0.0.0', 8080);
        connectAuthEmulator(auth, 'http://0.0.0.0:9099');
        connectFunctionsEmulator(functions, '0.0.0.0', 5001);
        console.log("Successfully connected to Firebase emulators.");
    } catch (e) {
        console.error("Error connecting to Firebase emulators:", e);
    }
}


export { app, firestore, auth, functions };
