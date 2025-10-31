
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

const AccountSkeleton = () => (
  <div className="space-y-0">
    <div className="flex flex-row justify-between items-center p-3 border-b border-white/20">
      <div>
        <Skeleton className="h-5 w-40 bg-white/20" />
        <Skeleton className="h-6 w-32 mt-1 bg-white/20" />
      </div>
      <ChevronRight className="h-6 w-6" />
    </div>
    <div className="flex flex-row justify-between items-center p-3">
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
    <div className="space-y-0">
      {accounts && accounts.length > 0 ? (
        accounts.map((account, index) => {
          const isDormant = account.name === 'Savvy Bundle Current Account';
          return (
            <Link href={`/account/${account.id}`} key={account.id}>
              <div className={cn(
                "flex flex-row justify-between items-center p-3 cursor-pointer text-white",
                index < accounts.length - 1 ? 'border-b border-white/20' : ''
              )}>
                <div>
                  <p className={cn("text-sm font-normal normal-case", isDormant && "text-white/60")}>{account.name}</p>
                  <p className={cn("text-base font-normal", isDormant && "text-white/60")}>{formatCurrency(account.balance, account.currency)}</p>
                </div>
                <ChevronRight className={cn("h-6 w-6", isDormant && "text-white/60")} />
              </div>
            </Link>
          );
        })
      ) : (
         <div className="text-center py-4">
            <p className="text-sm text-white">No accounts found.</p>
            <p className="text-xs text-white/80">This can happen if you just signed up. Try refreshing.</p>
         </div>
      )}
    </div>
  );
}
