
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Account } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

const AccountSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-row justify-between items-center p-3 bg-white/10 border border-white/20 rounded-lg">
      <div>
        <Skeleton className="h-5 w-40 bg-white/20" />
        <Skeleton className="h-6 w-32 mt-1 bg-white/20" />
      </div>
      <ChevronRight className="h-6 w-6" />
    </div>
    <div className="flex flex-row justify-between items-center p-3 bg-white/10 border border-white/20 rounded-lg">
      <div>
        <Skeleton className="h-5 w-32 bg-white/20" />
        <Skeleton className="h-6 w-28 mt-1 bg-white/20" />
      </div>
      <ChevronRight className="h-6 w-6" />
    </div>
  </div>
)

export function Accounts() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const accountsQuery = useMemoFirebase(() => {
    // Wait until the user is loaded and authenticated
    if (!firestore || !user?.uid) return null;
    // Query for accounts belonging to the current user
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);

  const { data: accounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

  // Show skeleton while user is logging in OR accounts are fetching
  if (isUserLoading || isAccountsLoading) {
    return <AccountSkeleton />;
  }

  return (
    <div className="space-y-4">
      {accounts && accounts.length > 0 ? (
        accounts.map((account) => (
          <Link href={`/account/${account.id}`} key={account.id}>
            <div className="flex flex-row justify-between items-center p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20">
              <div>
                <p className="text-sm font-normal normal-case">{account.name}</p>
                <p className="text-base font-normal">{formatCurrency(account.balance, account.currency)}</p>
              </div>
              <ChevronRight className="h-6 w-6" />
            </div>
          </Link>
        ))
      ) : (
         <div className="text-center py-4">
            <p className="text-sm">No accounts found.</p>
            <p className="text-xs text-white/80">You can add account data under your user document in Firestore.</p>
          </div>
      )}
    </div>
  );
}
