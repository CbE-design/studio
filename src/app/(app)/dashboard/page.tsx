
'use client';

import {
  Bell,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AccountsCarousel } from '@/components/accounts-carousel';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/app/lib/definitions';
import { collection, getDocs, query } from 'firebase/firestore';

// Custom SVG Icons
const OffersIcon = () => (
    <Image 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758622591390.jpg?alt=media&token=2f681462-7001-4654-9754-436e2c8f0ffe"
        alt="Offers for you icon"
        fill
        className="object-contain"
    />
);


const ApplicationsIcon = () => (
    <Image 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758629149375.jpg?alt=media&token=485765e5-456f-412c-8da5-751ff5991dd5"
        alt="Applications icon"
        fill
        className="object-contain"
    />
);
const InsureIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758630016360.jpg?alt=media&token=a946409a-39bd-47d1-ac07-9a00dca954cb"
        alt="Insure icon"
        fill
        className="object-contain"
    />
);
const NedbankConnectIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758631700022.jpg?alt=media&token=148194a4-0b1a-4ea4-929e-956599069261"
        alt="Nedbank Connect icon"
        fill
        className="object-contain"
    />
);
const DiscsAndFinesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8">
        <path d="M19 17h2l.64-2.55a4 4 0 0 0-3.03-4.38L14 8.5V6a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2.5L1.39 10.07a4 4 0 0 0-3.03 4.38L-1 17h2"/>
        <path d="M19 17a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-14 0a2 2 0 1 1 0-4 2 2 0 0-1 0 4z"/>
        <path d="M5 13V7.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 17 7.5V13"/>
    </svg>
);
const ShopIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758633570031.jpg?alt=media&token=b776f61f-926e-48ab-9f7c-9b18821c8b02"
        alt="Shop icon"
        fill
        className="object-contain"
    />
);
const PayShapIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635261879.jpg?alt=media&token=c6e6272c-58fc-4a13-bc26-12f5c77ceb7e"
        alt="PayShap icon"
        fill
        className="object-contain"
    />
);
const LatestIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8">
        <path d="M20 12v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
        <path d="M12 18a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"/>
        <path d="M10 6a2 2 0 1 1 4 0"/>
    </svg>
);
const QuickPayIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635889725.jpg?alt=media&token=7ac2249c-b95f-43b6-83e6-80a4fd291ab2"
        alt="Quick Pay icon"
        fill
        className="object-contain"
    />
);
const GetCashIcon = () => (
    <Image
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758636434590.jpg?alt=media&token=9a2b5c0a-b399-4780-981a-3bd21e8d55e9"
        alt="Get cash icon"
        fill
        className="object-contain"
    />
);
const HomeLoansIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
    </svg>
);
const StatementsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
    </svg>
);

const widgets = [
  { icon: OffersIcon, label: 'Offers for you', href: '#' },
  { icon: ApplicationsIcon, label: 'Applications', href: '#' },
  { icon: InsureIcon, label: 'Insure', href: '#' },
  { icon: NedbankConnectIcon, label: 'Nedbank Connect', new: true, href: '#' },
  { icon: DiscsAndFinesIcon, label: 'Discs and fines', href: '#' },
  { icon: ShopIcon, label: 'Shop', href: '#' },
  { icon: PayShapIcon, label: 'PayShap', href: '#' },
  { icon: LatestIcon, label: 'Latest', href: '#' },
  { icon: QuickPayIcon, label: 'Quick Pay', href: '#' },
  { icon: GetCashIcon, label: 'Get cash', href: '#' },
  { icon: HomeLoansIcon, label: 'Home loans', href: '#' },
  { icon: StatementsIcon, label: 'Statements and docs', href: '/documents' },
];

const WidgetItem = ({ icon: Icon, label, href, isNew }: { icon: React.ElementType, label: string, href: string, isNew?: boolean }) => (
    <Link href={href}>
        <div className="flex flex-col items-center justify-center space-y-2 text-center h-full bg-white p-2 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="relative flex items-center justify-center w-14 h-14 rounded-lg">
                {isNew && (
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-sm z-10">
                        New
                    </div>
                )}
                <Icon />
            </div>
            <p className="text-xs text-gray-700 font-medium h-8 flex items-center justify-center text-center px-1">{label}</p>
        </div>
    </Link>
);

const LoadingSkeleton = () => (
  <div className="flex flex-col h-full bg-white text-black">
    <header className="bg-white text-black p-4 space-y-4 sticky top-0 z-10 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-md bg-gray-200" />
          <Skeleton className="h-6 w-48 bg-gray-200" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5 rounded-full bg-gray-200" />
          <Skeleton className="h-5 w-5 rounded-full bg-gray-200" />
        </div>
      </div>
    </header>
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-gray-100 p-4">
        <Skeleton className="h-40 w-full bg-gray-200 rounded-lg" />
      </div>
      <div className="p-4">
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
      </div>
    </main>
  </div>
);

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = useState(0);

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);
  const { data: accounts, isLoading: isAccountsLoading } = useCollection(accountsQuery);
  
  useEffect(() => {
    // If loading is finished and there is no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!accounts || isUserLoading || isAccountsLoading) return;

    const fetchAndCountTransactions = async () => {
        if (!user?.uid) return;

        let allTransactions: Transaction[] = [];
        for (const account of accounts) {
            const transactionsCollectionRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
            const transactionsSnapshot = await getDocs(query(transactionsCollectionRef));
            transactionsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.date && data.transactionType !== 'BANK_FEE') {
                     allTransactions.push({ id: doc.id, ...data } as Transaction);
                }
            });
        }
        
        try {
            const readIds = JSON.parse(localStorage.getItem('readTransactionIds') || '[]');
            const newUnreadCount = allTransactions.filter(tx => !readIds.includes(tx.id)).length;
            setUnreadCount(newUnreadCount);
        } catch (e) {
            console.error("Failed to parse readTransactionIds from localStorage", e);
            setUnreadCount(allTransactions.length);
        }
    };
    
    fetchAndCountTransactions();
  }, [accounts, firestore, user?.uid, isUserLoading, isAccountsLoading, router]);

  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="gradient-background text-white p-4 space-y-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
              alt="Nedbank Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-medium text-lg">VAN SCHALKWYK FAMILY TRUST</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-lime-400 border-2 border-green-800" />
                )}
              </div>
            </Link>
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="gradient-background text-white p-4">
            <AccountsCarousel />
        </div>
        <div className="p-4">
            <div className="my-2 md:my-4 mx-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-lg shadow-sm border border-gray-200">
                <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/CutPaste_2025-09-25_19-22-52-484.png?alt=media&token=611adbd9-a489-4019-99a0-d0aa83f6a21a"
                alt="Advertisement banner"
                data-ai-hint="advertisement banner"
                width={600}
                height={100}
                className="w-full"
                />
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <div className="grid grid-cols-4 gap-2">
              {widgets.map((widget) => (
                  <WidgetItem 
                    key={widget.label} 
                    icon={widget.icon} 
                    label={widget.label} 
                    href={widget.href}
                    isNew={widget.new} 
                  />
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}

