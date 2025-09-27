
'use client';

import type { Account } from '@/app/lib/definitions';
import { TransferForm } from '@/components/transfer-form';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton = () => (
    <div className="p-4 space-y-6 animate-pulse">
        <div className="h-24 gradient-background" />
        <Skeleton className="h-40 bg-gray-200" />
        <Skeleton className="h-40 bg-gray-200" />
        <Skeleton className="h-20 bg-gray-200" />
    </div>
)

export default function TransferPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);

  const { data: allAccounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

  const isLoading = isUserLoading || isAccountsLoading;

  if (isLoading || !allAccounts) {
      return <LoadingSkeleton />;
  }

  return (
    <TransferForm allAccounts={allAccounts} />
  );
}
