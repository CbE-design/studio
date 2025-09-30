
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase-provider';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Transaction } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
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

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-800">{value}</p>
        </div>
    );
};

const NotificationItem = ({ notification, isExpanded, onToggle }: { notification: Transaction, isExpanded: boolean, onToggle: () => void }) => {
    const date = parseISO(notification.date);
    return (
        <div className="border-b bg-white last:border-b-0">
            <div onClick={onToggle} className="flex items-center justify-between p-4 cursor-pointer">
                <div className="flex items-center gap-4">
                    {!notification.id.startsWith('read-') && <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>}
                    <div className={cn(notification.id.startsWith('read-') && 'ml-6')}>
                        <p className={cn("text-base uppercase", !notification.id.startsWith('read-') && "font-bold")}>
                            {notification.description}
                        </p>
                        <p className="text-sm text-gray-500">{format(date, "dd MMMM yyyy 'at' HH:mm")}</p>
                    </div>
                </div>
                <p className={cn("text-base", !notification.id.startsWith('read-') && "font-bold")}>
                    {formatCurrency(notification.amount, 'ZAR')}
                </p>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 bg-white">
                    <DetailRow label="Transaction Type" value={notification.type?.toUpperCase()} />
                    <DetailRow label="Account number" value={notification.accountNumber} />
                    <DetailRow label="Location" value={notification.bank} />
                    <DetailRow label="Contract reference number" value={notification.recipientReference} />
                </div>
            )}
        </div>
    );
};

const LoadingSkeleton = () => (
    <div>
        <div className="p-4"><Skeleton className="h-8 w-1/3" /></div>
        <div className="px-4 space-y-px">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
        <div className="p-4 mt-4"><Skeleton className="h-8 w-1/3" /></div>
        <div className="px-4 space-y-px">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);

export default function TransactionNotificationsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const accountsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);
    const { data: accounts } = useCollection(accountsQuery);

    useEffect(() => {
        if (!accounts || isUserLoading) return;

        const fetchAllTransactions = async () => {
            setIsTransactionsLoading(true);
            try {
                if (!user?.uid) {
                    setIsTransactionsLoading(false);
                    return;
                }
                let allTransactions: Transaction[] = [];

                for (const account of accounts) {
                    const transactionsCollectionRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
                    const transactionsSnapshot = await getDocs(query(transactionsCollectionRef));
                    transactionsSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.date) {
                             allTransactions.push({ id: doc.id, ...data, accountNumber: account.accountNumber } as Transaction);
                        }
                    });
                }
                
                allTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
                setTransactions(allTransactions);
            } catch (error: any) {
                console.error("Error fetching transactions:", error);
            } finally {
                setIsTransactionsLoading(false);
            }
        };

        fetchAllTransactions();
    }, [accounts, firestore, user?.uid, isUserLoading]);
    
    const handleToggle = (id: string) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => 
            (tx.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (tx.recipientName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const groupedTransactions = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            const date = parseISO(tx.date);
            let groupName = 'Older';
            if (isToday(date)) {
                groupName = 'Today';
            } else if (isYesterday(date)) {
                groupName = 'Yesterday';
            }
            
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(tx);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [filteredTransactions]);

    const groupOrder = ['Today', 'Yesterday', 'Older'];
    const isLoading = isUserLoading || isTransactionsLoading;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-30">
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
                     <div className="text-center p-8 text-gray-500 bg-white mt-4 mx-4 rounded-lg">
                        <p>No notifications to show.</p>
                     </div>
                ) : (
                    <>
                        {groupOrder.map(groupName => {
                            const items = groupedTransactions[groupName];
                            if (!items || items.length === 0) return null;

                            return (
                                <div key={groupName}>
                                    <h2 className="bg-gray-100 text-gray-600 font-bold p-2 px-4 uppercase">
                                        {groupName}
                                    </h2>
                                    <div>
                                        {items.map(tx => (
                                            <NotificationItem
                                                key={tx.id}
                                                notification={tx}
                                                isExpanded={expandedId === tx.id}
                                                onToggle={() => handleToggle(tx.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </main>
        </div>
    );
}
