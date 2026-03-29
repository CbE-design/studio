import { useEffect, useState } from 'react';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Transaction } from '@/lib/definitions';

export function useAllTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    const q = query(
      collectionGroup(firestore, 'transactions'),
      where('userId', '==', uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
        const sorted = [...docs].sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        });
        setTransactions(sorted);
        setIsLoading(false);
      },
      () => {
        setTransactions([]);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { transactions, isLoading };
}
