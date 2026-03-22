'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase-provider';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const dynamic = 'force-dynamic';

interface FailedTransaction {
    id: string;
    returnDate: string;
    fromAccount: string;
    toAccount: string;
    beneficiaryName: string;
    branchCode: string;
    failureReason: string;
}

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="py-2 border-b last:border-b-0">
    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
  </div>
);

const LoadingSkeleton = () => (
    <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

export default function FailedTransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const failedTransactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !accountId) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'failedTransactions'));
  }, [firestore, user, accountId]);

  const { data: failedTransactions, isLoading: isTransactionsLoading } = useCollection<FailedTransaction>(failedTransactionsQuery);

  const groupedAndSortedTransactions = useMemo(() => {
    if (!failedTransactions) return {};

    // Sort alphabetically by beneficiary name
    const sorted = [...failedTransactions].sort((a, b) => 
        (a.beneficiaryName || '').localeCompare(b.beneficiaryName || '')
    );

    // Group by first letter
    return sorted.reduce((acc, tx) => {
        const firstLetter = (tx.beneficiaryName || '#').trim().charAt(0).toUpperCase();
        const group = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
        if (!acc[group]) acc[group] = [];
        acc[group].push(tx);
        return acc;
    }, {} as Record<string, FailedTransaction[]>);
  }, [failedTransactions]);

  const sortedGroups = Object.keys(groupedAndSortedTransactions).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  const isLoading = isUserLoading || isTransactionsLoading;

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="brand-header text-primary-foreground p-4 flex items-center sticky top-0 z-20 shadow-md">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2 text-white hover:bg-white/10" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Failed transactions</h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        {isLoading ? (
            <LoadingSkeleton />
        ) : sortedGroups.length > 0 ? (
            <div className="pb-10">
                {sortedGroups.map(group => (
                    <div key={group}>
                        <h2 className="bg-gray-100 text-gray-500 font-bold p-2 px-6 text-xs uppercase tracking-widest sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                            {group}
                        </h2>
                        <Accordion type="single" collapsible className="w-full bg-white">
                            {groupedAndSortedTransactions[group].map((tx) => (
                                <AccordionItem value={tx.id} key={tx.id} className="px-6 border-b border-gray-100">
                                    <AccordionTrigger className="hover:no-underline py-5 group">
                                        <span className="text-base font-medium text-gray-800 text-left group-data-[state=open]:text-primary transition-colors">
                                            {tx.beneficiaryName}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-6">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
                                            <DetailRow label="Failure reason" value={tx.failureReason || "Not Authorised"} />
                                            <DetailRow label="Return date" value={tx.returnDate} />
                                            <DetailRow label="From account" value={tx.fromAccount} />
                                            <DetailRow label="To account" value={tx.toAccount} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ArrowLeft className="h-10 w-10 text-gray-300 rotate-45" />
                </div>
                <p className="text-lg font-bold text-gray-700">No failed transactions</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                    All processed payments have been cleared successfully by the bank.
                </p>
            </div>
        )}
      </main>
    </div>
  );
}
