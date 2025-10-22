
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase-provider';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
  <div className="py-4 border-b last:border-b-0">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-base text-gray-800">{value || '-'}</p>
  </div>
);

const LoadingSkeleton = () => (
    <div className="p-6">
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
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

  const isLoading = isUserLoading || isTransactionsLoading;

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Failed transactions</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
            <LoadingSkeleton />
        ) : failedTransactions && failedTransactions.length > 0 ? (
            <div className="divide-y">
                {failedTransactions.map(tx => (
                    <div key={tx.id} className="p-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                             <DetailRow label="Beneficiary name" value={tx.beneficiaryName} />
                             <DetailRow label="Failure reason" value="Not Authorised" />
                             <DetailRow label="Return date" value={tx.returnDate} />
                             <DetailRow label="From account" value={tx.fromAccount} />
                             <DetailRow label="To account" value={tx.toAccount} />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center p-8 text-gray-500">
                <p>No failed transactions found.</p>
            </div>
        )}
      </main>
    </div>
  );
}
