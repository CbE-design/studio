import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Account } from '@/lib/definitions';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }
    const q = collection(firestore, 'users', uid, 'bankAccounts');
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account));
        setIsLoading(false);
      },
      () => {
        setAccounts([]);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  return { accounts, isLoading, totalBalance };
}
