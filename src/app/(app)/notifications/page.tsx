
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase-provider';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/app/lib/data';

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-500"
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

const NotificationItem = ({ notification, isRead, onClick }: { notification: Transaction, isRead: boolean, onClick: () => void }) => {
    const date = new Date(notification.date);
    return (
        <div onClick={onClick} className="flex items-center justify-between py-4 border-b cursor-pointer">
            <div className="flex items-center gap-4">
                {!isRead && <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>}
                <div className={cn(isRead && 'ml-6')}>
                    <p className={cn("text-base uppercase", !isRead && "font-bold")}>
                        {notification.type} - {notification.recipientName || notification.description}
                    </p>
                    <p className="text-sm text-gray-500">{format(date, "dd MMMM yyyy 'at' HH:mm")}</p>
                </div>
            </div>
            <p className={cn("text-base", !isRead && "font-bold")}>
                {formatCurrency(notification.amount, 'ZAR')}
            </p>
        </div>
    );
};


const LoadingSkeleton = () => (
    <div className="px-4 pt-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-8 w-1/3 mt-8 mb-4" />
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);

export default function NotificationsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);

    const { data: accounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

    useEffect(() => {
        if (isUserLoading || isAccountsLoading) return;
        if (!firestore || !user?.uid || !accounts) {
            setIsTransactionsLoading(false);
            return;
        }

        const fetchAllTransactions = async () => {
            setIsTransactionsLoading(true);
            try {
                const allTransactions: Transaction[] = [];
                for (const account of accounts) {
                    const transactionsColRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
                    const snapshot = await getDocs(transactionsColRef);
                    snapshot.forEach(doc => {
                        allTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
                    });
                }
                allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setTransactions(allTransactions);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setIsTransactionsLoading(false);
            }
        };

        fetchAllTransactions();
    }, [firestore, user?.uid, isUserLoading, accounts, isAccountsLoading]);

    const handleRead = (id: string) => {
        setReadIds(prev => new Set(prev).add(id));
    };

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => 
            (tx.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (tx.recipientName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {
            'Today': [],
            'Yesterday': [],
            'Older': [],
        };

        filteredTransactions.forEach(tx => {
            const date = new Date(tx.date);
            if (isToday(date)) {
                groups['Today'].push(tx);
            } else if (isYesterday(date)) {
                groups['Yesterday'].push(tx);
            } else {
                groups['Older'].push(tx);
            }
        });

        return groups;
    }, [filteredTransactions]);
    
    const isLoading = isUserLoading || isTransactionsLoading;

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-20">
                <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">Transaction notifications</h1>
            </header>

            <div className="p-4 bg-white sticky top-[68px] z-20 border-b">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search"
                            className="bg-gray-100 pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <FilterIcon />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : transactions.length === 0 ? (
                     <div className="text-center p-8 text-gray-500">
                        <p>No notifications to show.</p>
                     </div>
                ) : (
                    <div className="px-4">
                        {Object.entries(groupedTransactions).map(([group, items]) => (
                            items.length > 0 && (
                                <div key={group}>
                                    <h2 className="bg-gray-100 text-gray-600 font-bold p-2 my-2 -mx-4 px-4 sticky top-[140px] z-10">{group}</h2>
                                    {items.map(tx => (
                                        <NotificationItem
                                            key={tx.id}
                                            notification={tx}
                                            isRead={readIds.has(tx.id)}
                                            onClick={() => handleRead(tx.id)}
                                        />
                                    ))}
                                </div>
                            )
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
