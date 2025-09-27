
'use client';

import type { Account } from '@/app/lib/definitions';
import { formatCurrency, accounts } from '@/app/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
  // Using hardcoded data
  const userAccounts = accounts;

  return (
    <div className="space-y-4">
      {userAccounts && userAccounts.length > 0 ? (
        userAccounts.map((account) => (
          <Link href={`/account/${account.id}`} key={account.id}>
            <div className="flex flex-row justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10">
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
         </div>
      )}
    </div>
  );
}
