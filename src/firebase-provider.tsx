
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User, Unsubscribe } from 'firebase/auth';
import type { Firestore, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { getFirebaseApp, getFirebaseAuth, getFirebaseFirestore } from '@/app/lib/firebase';

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
  const [firebaseInstances, setFirebaseInstances] = useState<{
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
  }>({ app: null, auth: null, firestore: null });

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    
    async function initFirebase() {
      // Initialize Firebase only on client side
      const app = getFirebaseApp();
      const firestore = getFirebaseFirestore();
      const auth = await getFirebaseAuth();
      
      setFirebaseInstances({ app, auth, firestore });

      // Dynamically import onAuthStateChanged to avoid SSR issues
      const { onAuthStateChanged } = await import('firebase/auth');
      
      // Listen for auth state changes
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user); // This will be the user object or null
        setIsUserLoading(false);
      });
    }
    
    initFirebase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const value = { 
    app: firebaseInstances.app, 
    auth: firebaseInstances.auth, 
    firestore: firebaseInstances.firestore, 
    user, 
    isUserLoading 
  };

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
            setData(null);
            setIsLoading(false);
            return;
        }

        // Set loading to true whenever the query changes
        setIsLoading(true);
        
        let unsubscribe: (() => void) | null = null;
        
        async function setupSnapshot() {
            const { onSnapshot } = await import('firebase/firestore');
            unsubscribe = onSnapshot(query, (snapshot: QuerySnapshot<T>) => {
                const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setData(docs);
                setIsLoading(false);
            }, (err) => {
                console.error(err);
                setError(err);
                setIsLoading(false);
            });
        }
        
        setupSnapshot();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return { data, isLoading, error };
}

// Custom hook to memoize expensive object creation (like Firestore queries)
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(factory, deps);
}
