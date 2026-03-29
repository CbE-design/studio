import { useEffect, useState } from 'react';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { normalizeDate } from '@/lib/format';
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
          const da = normalizeDate(a.date).getTime();
          const db = normalizeDate(b.date).getTime();
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
