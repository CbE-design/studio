
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Functions region
const functionsRegion = 'us-central1';

// Lazy initialization - only store instances on client
let _app: FirebaseApp | null = null;
let _firestore: Firestore | null = null;
let _auth: Auth | null = null;
let _functions: Functions | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase App should only be initialized on the client side');
  }
  
  if (!_app) {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
}

export function getFirebaseFirestore(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore should only be initialized on the client side');
  }
  if (!_firestore) {
    _firestore = getFirestore(getFirebaseApp());
  }
  return _firestore;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available on the client side');
  }
  if (!_auth) {
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export async function getFirebaseFunctions(): Promise<Functions> {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Functions is only available on the client side');
  }
  if (!_functions) {
    const { getFunctions } = await import('firebase/functions');
    _functions = getFunctions(getFirebaseApp(), functionsRegion);
  }
  return _functions;
}
