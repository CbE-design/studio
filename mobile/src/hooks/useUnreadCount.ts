import { useEffect, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/lib/firebase';

const READ_IDS_KEY = 'readTransactionIds';

let _refresh: (() => void) | null = null;

export function triggerUnreadRefresh() {
  _refresh?.();
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setCount(0); return; }
    try {
      const accountsSnap = await getDocs(collection(firestore, 'users', uid, 'bankAccounts'));
      const allIds: string[] = [];
      await Promise.all(
        accountsSnap.docs.map(async (accDoc) => {
          const txSnap = await getDocs(
            collection(firestore, 'users', uid, 'bankAccounts', accDoc.id, 'transactions'),
          );
          txSnap.docs.forEach((d) => allIds.push(d.id));
        }),
      );
      const stored = await AsyncStorage.getItem(READ_IDS_KEY);
      const readIds: string[] = stored ? (JSON.parse(stored) as string[]) : [];
      const unread = allIds.filter((id) => !readIds.includes(id)).length;
      setCount(unread);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    _refresh = () => { void refresh(); };
    refresh();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    });
    return () => {
      _refresh = null;
      sub.remove();
    };
  }, [refresh]);

  return count;
}
