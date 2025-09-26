
'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, ChevronRight, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useCollection, useDocument, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';


const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-primary"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const tabs = ['Transactions', 'Debit orders', 'Scheduled', 'Card management', 'Statements'];

const LoadingSkeleton = () => (
  <div className="flex flex-col h-screen bg-gray-50">
    <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="mr-2 -ml-2">
            <ArrowLeft />
          </Button>
          <div>
            <Skeleton className="h-6 w-48 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-32 mt-1 bg-primary-foreground/20" />
          </div>
        </div>
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex justify-between">
        <div className="text-left">
          <p className="text-xs opacity-80">Current balance</p>
          <Skeleton className="h-7 w-36 mt-1 bg-primary-foreground/20" />
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Available balance</p>
          <Skeleton className="h-7 w-36 mt-1 bg-primary-foreground/20" />
        </div>
      </div>
    </header>
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

export default function AccountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const accountDocRef = useMemoFirebase(() => {
    if (!firestore || !accountId || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
  }, [firestore, accountId, user?.uid]);

  const { data: account, isLoading: isAccountLoading } = useDocument<Account>(accountDocRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !accountId || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'transactions'));
  }, [firestore, accountId, user?.uid]);

  const { data: accountTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const sortedTransactions = useMemo(() => {
    if (!accountTransactions) return [];
    return [...accountTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [accountTransactions]);

  if (isUserLoading || isAccountLoading || isTransactionsLoading) {
    return <LoadingSkeleton />;
  }

  if (!account) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center p-4 text-center">
        <p className="text-xl text-destructive-foreground bg-destructive p-4 rounded-md">Account not found.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 -ml-2">
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="text-xl font-normal normal-case">{account.name}</h1>
              <p className="text-sm opacity-80">{account.accountNumber}</p>
            </div>
          </div>
          <MessageSquare className="h-6 w-6" />
        </div>
        <div className="flex justify-between">
          <div className="text-left">
            <p className="text-xs opacity-80">Current balance</p>
            <p className="text-base font-normal">{formatCurrency(account.balance, account.currency)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs opacity-80">Available balance</p>
            <p className="text-base font-normal">{formatCurrency(account.balance, account.currency)}</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b sticky top-[138px] z-10">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-4 px-4">
            {tabs.map((tab, index) => (
              <div
                key={tab}
                className={cn(
                  "py-3 text-sm font-medium cursor-pointer text-gray-500",
                  index === 0 && "text-primary border-b-2 border-primary"
                )}
              >
                {tab}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b">
                <p>Failed transactions</p>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b">
                <p>Once-off payments</p>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <Link href={`/account/${accountId}/statement`}>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b">
                <p>View Statement</p>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
        </div>
        
        <div className="p-4 space-y-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Search" className="bg-white pl-10" />
            </div>
            <div className="flex items-center gap-1 text-primary font-medium">
              <span>Filter</span>
              <FilterIcon />
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="p-4 bg-gray-100">
            <h2 className="font-bold text-gray-600 text-sm">THIS WEEK</h2>
          </div>
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 border-b">
                <div>
                  <p className="text-sm font-semibold">{tx.description}</p>
                  <p className="text-sm text-gray-500">{format(new Date(tx.date), 'dd MMM yyyy')}</p>
                </div>
                <p className={cn(
                  "font-semibold",
                  tx.type === 'debit' ? 'text-gray-800' : 'text-green-600'
                )}>
                  {formatCurrency(tx.amount, account.currency)}
                </p>
              </div>
            ))
          ) : (
             <div className="text-center p-8 text-gray-500">
                <p>No transactions found for this account.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
