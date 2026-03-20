'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isThisWeek, startOfWeek, subDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query } from 'firebase/firestore';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative w-5 h-5 flex items-center justify-center bg-transparent", className)}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_172101952.png?alt=media&token=2d52b45c-6169-486b-8c04-8e3965a21d47"
      alt="Messages"
      fill
      className="object-contain"
    />
  </div>
);

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
    <header className="gradient-background text-white p-4 space-y-4">
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
        <Skeleton className="h-5 w-5 bg-white/20 rounded-full" />
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
    if (!firestore || !user?.uid || !accountId || isUserLoading) {
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
                console.log("No such account document!");
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
  }, [firestore, user?.uid, accountId, isUserLoading]);

  const groupedTransactions = useMemo(() => {
    if (!accountTransactions) return {};
    
    const sorted = [...accountTransactions].sort((a, b) => {
        const dateA = a.date ? normalizeDate(a.date).getTime() : 0;
        const dateB = b.date ? normalizeDate(b.date).getTime() : 0;
        return dateB - dateA;
    });

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startOfLastWeek = subDays(startOfThisWeek, 7);

    return sorted.reduce((acc, tx) => {
      if (!tx.date) return acc;
      const date = normalizeDate(tx.date);
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
      <div className="shadow-sm">
        <header className="sticky top-0 z-30 bg-[#3C7D35] text-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 -ml-2">
                <ArrowLeft strokeWidth={2.5} />
              </Button>
              <div className="text-left">
                <h1 className="text-base font-medium">{account.name}</h1>
                <p className="text-sm opacity-80">{account.accountNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/notifications">
                <div className="relative w-5 h-5 bg-transparent">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320141309.png?alt=media&token=1836ae99-d919-48db-85fe-013baef40979"
                    alt="Notifications"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <Link href="/ai-chat">
                <MessageIcon />
              </Link>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-left">
              <p className="text-xs opacity-80">Current balance</p>
              <p className="text-sm font-medium">{formatCurrency(account.balance, account.currency)}</p>
            </div>
            <div className="text-left">
              <p className="text-xs opacity-80">Available balance</p>
              <p className="text-sm font-medium">{formatCurrency(account.balance, account.currency)}</p>
            </div>
          </div>
        </header>
        <div className="bg-white">
          <ScrollArea className="w-full whitespace-nowrap border-b">
            <div className="flex space-x-4 px-4">
              {tabs.map((tab, index) => (
                <div
                  key={tab}
                  className={cn(
                    "py-3 text-sm font-medium cursor-pointer text-gray-500",
                    index === 0 && "text-black font-bold border-b-2 border-primary"
                  )}
                >
                  {tab}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
          <div>
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
           <div className="flex items-center p-2 bg-white border-b">
            <div className="flex items-center border-2 border-gray-400 px-4 py-2 flex-grow">
              <input
                placeholder="Search"
                className="text-lg text-gray-500 w-full bg-transparent outline-none border-none mr-2"
              />
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex items-center ml-4 text-primary cursor-pointer">
              <span className="font-medium mr-2">Filter</span>
              <FilterIcon />
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white">
          {isTransactionsLoading ? (
            <div className="p-4 space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
          ) : Object.keys(groupedTransactions).length > 0 ? (
            ['THIS WEEK', 'LAST WEEK', 'OLDER'].map(group => (
              groupedTransactions[group] && (
                <div key={group}>
                  <h2 className="bg-gray-100 text-gray-600 font-bold p-2 px-4 text-sm uppercase">{group}</h2>
                  <div>
                    {groupedTransactions[group].map(tx => (
                       <Link href={`/account/${accountId}/transaction/${tx.id}`} key={tx.id}>
                          <div className="flex items-center justify-between py-4 px-4 bg-white border-b border-gray-200 cursor-pointer">
                              <div className="flex flex-col">
                                  <p className="text-sm text-gray-400 mb-1">{format(normalizeDate(tx.date), 'dd MMM yyyy')}</p>
                                  <p className="text-base font-light text-gray-800 uppercase">{tx.recipientName || tx.description}</p>
                              </div>
                               <p className="text-base font-light text-gray-800">
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
