'use client';

import { useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account } from '@/app/lib/definitions';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, EyeOff, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/app/lib/data';

const HIDDEN_KEY = 'hiddenAccountIds';

function getHiddenIds(): string[] {
    try {
        const raw = localStorage.getItem(HIDDEN_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setHiddenIds(ids: string[]) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

export default function SettingsPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);

    const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);
    const [hiddenIds, setHiddenIdsState] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setHiddenIdsState(getHiddenIds());
        setMounted(true);
    }, []);

    const toggleAccount = (accountId: string) => {
        setHiddenIdsState(prev => {
            const next = prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId];
            setHiddenIds(next);
            return next;
        });
    };

    const isHidden = (accountId: string) => hiddenIds.includes(accountId);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="brand-header text-white px-4 py-4 flex items-center gap-3 shrink-0">
                <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full">
                    <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <h1 className="text-lg font-bold tracking-wide">Settings</h1>
            </header>

            <main className="flex-1 overflow-y-auto">
                {/* Hide Accounts Section */}
                <div className="mt-6">
                    <h2 className="px-4 mb-2 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                        Account Visibility
                    </h2>
                    <div className="bg-white border-y">
                        {(isLoading || isUserLoading || !mounted) ? (
                            <div className="divide-y divide-gray-100">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center p-4 gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-11 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : accounts && accounts.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {accounts.map(account => {
                                    const hidden = isHidden(account.id);
                                    return (
                                        <li key={account.id} className="flex items-center p-4 gap-4">
                                            {/* Icon */}
                                            <div className="h-10 w-10 rounded-full bg-[#007a33]/10 flex items-center justify-center shrink-0">
                                                {hidden
                                                    ? <EyeOff className="h-5 w-5 text-[#007a33]/60" />
                                                    : <Eye className="h-5 w-5 text-[#007a33]" />
                                                }
                                            </div>

                                            {/* Account info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${hidden ? 'text-gray-400' : 'text-gray-800'}`}>
                                                    {account.name}
                                                </p>
                                                <p className={`text-xs mt-0.5 ${hidden ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {hidden ? 'Hidden on dashboard' : formatCurrency(account.balance, account.currency)}
                                                </p>
                                            </div>

                                            {/* Toggle */}
                                            <Switch
                                                checked={!hidden}
                                                onCheckedChange={() => toggleAccount(account.id)}
                                                className="data-[state=checked]:bg-[#007a33]"
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="p-4 text-sm text-gray-400 text-center">No accounts found.</p>
                        )}
                    </div>
                    <p className="px-4 mt-2 text-[11px] text-gray-400">
                        Hidden accounts won't appear in your dashboard. You can unhide them at any time from this screen.
                    </p>
                </div>
            </main>
        </div>
    );
}
