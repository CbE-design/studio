
'use client';

import { accounts as staticAccounts } from '@/app/lib/data';
import { formatCurrency } from '@/app/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Accounts() {
  const accounts = staticAccounts.slice(0, 2); // Display first two accounts as before

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
          </div>
      )}
    </div>
  );
}
