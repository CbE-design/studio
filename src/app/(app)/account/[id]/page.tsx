
'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isThisWeek, startOfWeek, subDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query } from 'firebase/firestore';

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
    <header className="gradient-background text-white p-4 sticky top-0 z-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="mr-2 -ml-2">
            <ArrowLeft />
          </Button>
          <div>
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-4 w-32 mt-1 bg-white/20" />
          </div>
        </div>
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex justify-between">
        <div className="text-left">
          <p className="text-xs opacity-80">Current balance</p>
          <Skeleton className="h-7 w-36 mt-1 bg-white/20" />
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Available balance</p>
          <Skeleton className="h-7 w-36 mt-1 bg-white/20" />
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
  
  const [account, setAccount] = useState<Account | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !accountId) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'transactions'));
  }, [firestore, user?.uid, accountId]);

  const { data: accountTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
  
  useEffect(() => {
    if (!firestore || !user?.uid || !accountId) {
      if (!isUserLoading) {
        setIsAccountLoading(false);
      }
      return;
    }

    const fetchAccountData = async () => {
        setIsAccountLoading(true);
        try {
            const accountDocRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
            const docSnap = await getDoc(accountDocRef);

            if (docSnap.exists()) {
                setAccount({ id: docSnap.id, ...docSnap.data() } as Account);
            } else {
                console.log("No such document!");
                setAccount(null);
            }
        } catch (error) {
            console.error("Error fetching account details:", error);
            setAccount(null);
        } finally {
            setIsAccountLoading(false);
        }
    };
    fetchAccountData();
    // Re-fetch account data if transactions change to update balance
  }, [firestore, user?.uid, accountId, isUserLoading]);

  const groupedTransactions = useMemo(() => {
    if (!accountTransactions) return {};
    
    const sorted = [...accountTransactions].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startOfLastWeek = subDays(startOfThisWeek, 7);

    return sorted.reduce((acc, tx) => {
      if (!tx.date) return acc;
      const date = new Date(tx.date);
      let group;

      if (isThisWeek(date, { weekStartsOn: 1 })) {
        group = 'THIS WEEK';
      } else if (date >= startOfLastWeek && date < startOfThisWeek) {
        group = 'LAST WEEK';
      } else {
        group = `OLDER`;
      }
      
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

  }, [accountTransactions]);

  const isLoading = isUserLoading || isAccountLoading;

  if (isLoading) {
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
      <header className="gradient-background text-white p-4 sticky top-0 z-10 space-y-4">
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
            <Link href={`/account/${accountId}/failed-transactions`}>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b">
                  <p>Failed transactions</p>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b">
                <p>Once-off payments</p>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
        </div>
        
        <div className="p-4 space-y-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Search" className="bg-gray-100 pl-10" />
            </div>
            <div className="flex items-center gap-1 text-primary font-medium">
              <span>Filter</span>
              <FilterIcon />
            </div>
          </div>
        </div>

        <div className="bg-white">
          {isTransactionsLoading ? (
            <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : Object.keys(groupedTransactions).length > 0 ? (
            ['THIS WEEK', 'LAST WEEK', 'OLDER'].map(group => (
              groupedTransactions[group] && (
                <div key={group}>
                  <h2 className="bg-gray-100 text-gray-600 font-bold p-2 px-4 text-sm">{group}</h2>
                  <div className="px-4">
                    {groupedTransactions[group].map(tx => (
                       <Link href={`/account/${accountId}/transaction/${tx.id}`} key={tx.id}>
                          <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0 cursor-pointer">
                              <div>
                                  <p className="text-xs text-gray-500">{format(new Date(tx.date), 'dd MMM yyyy')}</p>
                                  <p className="font-semibold text-sm text-gray-800 uppercase">{tx.recipientName || tx.description}</p>
                              </div>
                               <p className="font-semibold text-sm text-gray-900">
                                  {tx.type === 'debit' ? `-${formatCurrency(tx.amount, account.currency)}` : formatCurrency(tx.amount, account.currency)}
                              </p>
                          </div>
                       </Link>
                    ))}
                  </div>
                </div>
              )
            ))
          ) : (
             <div className="text-center p-8 text-gray-500 bg-white">
                <p>No transactions found for this account.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
