
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { app, auth, firestore } from '@/app/lib/firebase';

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
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // This will be the user object or null
      setIsUserLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const value = { app, auth, firestore, user, isUserLoading };

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
        if (query === null) {
            console.log('DEBUG useCollection: query is null');
            setData(null);
            setIsLoading(false);
            return;
        }

        // Set loading to true whenever the query changes
        setIsLoading(true);
        console.log('DEBUG useCollection: starting onSnapshot listener');

        const unsubscribe = onSnapshot(query, (snapshot: QuerySnapshot<T>) => {
            console.log('DEBUG useCollection: snapshot received, doc count:', snapshot.docs.length);
            snapshot.docs.forEach(doc => console.log('DEBUG doc:', doc.id));
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setData(docs);
            setIsLoading(false);
        }, (err) => {
            console.error('DEBUG useCollection ERROR:', err.code, err.message);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return { data, isLoading, error };
}

// Custom hook to memoize expensive object creation (like Firestore queries)
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(factory, deps);
}
