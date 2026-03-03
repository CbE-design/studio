'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AccountsCarousel } from '@/components/accounts-carousel';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/app/lib/firebase';

const LatestIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={cn("text-primary", className)}>
        <path d="M20 12v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
        <path d="M12 18a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"/>
        <path d="M10 6a2 2 1 1 4 0"/>
    </svg>
);

const HomeLoansIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={cn("text-primary", className)}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
    </svg>
);
const StatementsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={cn("text-primary", className)}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
    </svg>
);

const widgets = [
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758622591390.jpg?alt=media&token=2f681462-7001-4654-9754-436e2c8f0ffe", label: 'Offers for you', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758629149375.jpg?alt=media&token=485765e5-456f-412c-8da5-751ff5991dd5", label: 'Applications', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758630016360.jpg?alt=media&token=a946409a-39bd-47d1-ac07-9a00dca954cb", label: 'Insure', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758633570031.jpg?alt=media&token=b776f61f-926e-48ab-9f7c-9b18821c8b02", label: 'Shop', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635261879.jpg?alt=media&token=c6e6272c-58fc-4a13-bc26-12f5c77ceb7e", label: 'PayShap', href: '#', isNew: true },
  { icon: LatestIcon, label: 'Latest', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635889725.jpg?alt=media&token=7ac2249c-b95f-43b6-83e6-80a4fd291ab2", label: 'Quick Pay', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758636434590.jpg?alt=media&token=9a2b5c0a-b399-4780-981a-3bd21e8d55e9", label: 'Get cash', href: '#' },
  { icon: HomeLoansIcon, label: 'Home loans', href: '#' },
  { icon: StatementsIcon, label: 'Statements and docs', href: '/documents' },
];

const WidgetItem = ({ src, icon: Icon, label, href, isNew }: { src?: string, icon?: React.ElementType<{className?: string}>, label: string, href: string, isNew?: boolean }) => {

    return (
        <Link href={href}>
            <div className="flex flex-col items-center justify-start space-y-2 text-center h-full group">
                 <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-lg shadow-sm border border-gray-200 group-hover:shadow-md transition-shadow overflow-hidden">
                    {isNew && (
                        <div className="absolute -top-1.5 -right-1.5 px-1 py-0.5 text-[8px] font-semibold text-white bg-green-500 rounded-sm z-10">
                            New
                        </div>
                    )}
                    <div className="relative w-7 h-7">
                       {src ? (
                            <Image 
                                src={src}
                                alt={`${label} icon`}
                                fill
                                className="object-contain"
                            />
                        ) : Icon ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icon className="h-7 w-7 text-primary" />
                            </div>
                        ) : null}
                    </div>
                </div>
                <p className="text-xs text-gray-700 font-medium h-8 flex items-center justify-center text-center px-1 leading-tight">{label}</p>
            </div>
        </Link>
    );
};


const LoadingSkeleton = () => (
  <div className="flex flex-col h-screen bg-white text-black">
    <div className="gradient-background text-white sticky top-0 z-20 p-4">
        <header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md bg-white/20" />
              <Skeleton className="h-6 w-48 bg-white/20" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
            </div>
          </div>
        </header>
        <div className="mt-4">
            <Skeleton className="h-40 w-full bg-white/20 rounded-lg" />
        </div>
    </div>

    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <Skeleton className="h-24 w-full my-6 rounded-lg bg-gray-200" />
        <Skeleton className="h-8 w-1/3 mb-4 bg-gray-200" />
        <div className="grid grid-cols-4 gap-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
              <Skeleton className="w-16 h-4 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>
    </main>
  </div>
);


function useAllTransactions() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);
    const { data: accounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!accounts || !user?.uid) {
              if(!isUserLoading && !isAccountsLoading) setIsLoading(false);
              return;
            }

            setIsLoading(true);
            let allTransactions: Transaction[] = [];
            for (const account of accounts) {
                const transactionsRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
                const transactionsSnap = await getDocs(query(transactionsRef));
                transactionsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.date && data.transactionType !== 'BANK_FEE') {
                        allTransactions.push({ id: doc.id, ...data } as Transaction);
                    }
                });
            }
            setTransactions(allTransactions);
            setIsLoading(false);
        };

        fetchTransactions();
    }, [accounts, firestore, user?.uid, isUserLoading, isAccountsLoading]);

    return { transactions, isLoading: isLoading || isUserLoading || isAccountsLoading };
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { transactions, isLoading: isTransactionsLoading } = useAllTransactions();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellRinging, setIsBellRinging] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isTransactionsLoading || transactions.length === 0) return;

    try {
        const storedIdsValue = localStorage.getItem('readTransactionIds');
        const readIds = storedIdsValue ? JSON.parse(storedIdsValue) : [];
        const newUnreadCount = transactions.filter(tx => !readIds.includes(tx.id)).length;
        setUnreadCount(newUnreadCount);

        if (newUnreadCount > 0) {
            setIsBellRinging(true);
            const timer = setTimeout(() => setIsBellRinging(false), 30000); // Ring for 30 seconds
            return () => clearTimeout(timer);
        }
    } catch (e) {
        console.error("Failed to parse readTransactionIds from localStorage", e);
        setUnreadCount(transactions.length);
    }
  }, [transactions, isTransactionsLoading]);


  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black">
      <header className="sticky top-0 z-20 bg-[#00A651] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-hidden">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7"
              alt="Nedbank Logo"
              width={24}
              height={24}
              className="w-6 h-6 flex-shrink-0"
            />
            <span className="font-normal text-xl uppercase truncate">
              {user.displayName || 'DICKSON FAMILY TRUST'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-white flex-shrink-0">
            <Link href="/notifications">
              <div className={cn('relative', isBellRinging && 'animate-ring')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-lime-400 border border-green-800" />
                )}
              </div>
            </Link>
            <Link href="/ai-chat">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="8" y1="9" x2="16" y2="9"></line>
                  <line x1="8" y1="13" x2="14" y2="13"></line>
                </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="gradient-background text-white p-4 pt-0">
          <AccountsCarousel />
        </div>

        <div className="bg-white">
          <div className="mx-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-md shadow-sm border border-black/20 mt-4 bg-white">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/CutPaste_2025-09-25_19-22-52-484.png?alt=media&token=611adbd9-a489-4019-99a0-d0aa83f6a21a"
              alt="Advertisement banner"
              data-ai-hint="advertisement banner"
              width={600}
              height={0}
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="p-4 mt-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <div className="grid grid-cols-4 gap-x-2 gap-y-4">
              {widgets.map((widget) => (
                <WidgetItem
                  key={widget.label}
                  src={widget.src}
                  icon={widget.icon}
                  label={widget.label}
                  href={widget.href}
                  isNew={widget.isNew}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
