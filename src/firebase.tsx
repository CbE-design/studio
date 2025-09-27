
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  onSnapshot,
  Query,
  DocumentData,
  QuerySnapshot,
  type Firestore,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Types for our context
type FirebaseContextType = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  user: User | null;
  isUserLoading: boolean;
};

// Create the context
const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
  user: null,
  isUserLoading: true,
});

// Custom hook to access the context
export const useFirebase = () => useContext(FirebaseContext);
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useUser = () => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};

// The provider component
export function FirebaseProvider({ children }: PropsWithChildren<{}>) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase app
    const appInstance = !getApps().length
      ? initializeApp(firebaseConfig)
      : getApp();
    setApp(appInstance);
    setAuth(getAuth(appInstance));
    setFirestore(getFirestore(appInstance));
  }, []);

  useEffect(() => {
    if (!auth) return;

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsUserLoading(false);
      } else {
        // If no user, sign in anonymously
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed on provider load:", error);
          setIsUserLoading(false); // Still stop loading on error
        });
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [auth]);

  const value = useMemo(
    () => ({ app, auth, firestore, user, isUserLoading }),
    [app, auth, firestore, user, isUserLoading]
  );

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

// Custom hook for Firestore collection snapshots
export function useCollection<T extends DocumentData>(query: Query<T> | null) {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!query) {
            setData(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribe = onSnapshot(query, (snapshot: QuerySnapshot<T>) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setData(docs);
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [query]);

    return { data, isLoading, error };
}

// Custom hook to memoize expensive object creation (like Firestore queries)
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
    const cb = useCallback(factory, deps);
    return useMemo(cb, [cb]);
}
