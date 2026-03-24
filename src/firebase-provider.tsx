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
import { onSnapshot, collectionGroup, query, where } from 'firebase/firestore';
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
            setData(null);
            setIsLoading(false);
            return;
        }

        // Set loading to true whenever the query changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return { data, isLoading, error };
}

// Custom hook to fetch all transactions across all accounts for the current user
export function useAllTransactions() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    // We remove the server-side orderBy to avoid SDK assertion failures 
    // and sort in memory for better compatibility.
    const q = query(
      collectionGroup(firestore, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      // Sort in memory: Latest First
      const sorted = [...docs].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
      });

      setTransactions(sorted);
      setIsLoading(false);
    }, (err: any) => {
      console.warn("Firestore listener error in useAllTransactions:", err.message);
      setTransactions([]);
      setIsLoading(false);
    });

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [user, firestore]);

  return { transactions, isLoading };
}

// Custom hook to memoize expensive object creation (like Firestore queries)
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(factory, deps);
}
