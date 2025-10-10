
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase-provider';
import { doc, getDoc } from 'firebase/firestore';
import type { Account, Transaction } from '@/app/lib/definitions';
import { format } from 'date-fns';
import { formatCurrency } from '@/app/lib/data';
import { generateProofOfPaymentAction } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="py-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg text-gray-800">{value || '-'}</p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="flex flex-col h-screen">
    <header className="gradient-background text-primary-foreground p-4 flex items-center">
      <Skeleton className="h-6 w-6 mr-4 bg-white/20" />
      <Skeleton className="h-6 w-32 bg-white/20" />
    </header>
    <main className="flex-1 p-6 space-y-6">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-full" />
    </main>
    <footer className="p-4 bg-white border-t space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </footer>
  </div>
);


function TransactionDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const { id: accountId, txId } = params;

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!firestore || !user?.uid || !accountId || !txId) {
      if (!isUserLoading) setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const txDocRef = doc(firestore, `users/${user.uid}/bankAccounts/${accountId}/transactions/${txId}`);
        const txSnap = await getDoc(txDocRef);

        if (txSnap.exists()) {
          setTransaction({ id: txSnap.id, ...txSnap.data() } as Transaction);
        } else {
          console.error("Transaction not found");
        }

        const accDocRef = doc(firestore, `users/${user.uid}/bankAccounts/${accountId}`);
        const accSnap = await getDoc(accDocRef);
        if (accSnap.exists()) {
          setAccount({ id: accSnap.id, ...accSnap.data() } as Account);
        } else {
            console.error("Account not found");
        }

      } catch (error) {
        console.error("Error fetching transaction details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [firestore, user?.uid, accountId, txId, isUserLoading]);

  const handlePayAgain = () => {
    if (!transaction) return;
    const params = new URLSearchParams();
    params.set('bankName', transaction.bank || '');
    params.set('accountNumber', transaction.accountNumber || '');
    params.set('recipientName', transaction.recipientName || '');
    params.set('recipientReference', transaction.recipientReference || '');
    params.set('yourReference', transaction.yourReference || '');
    router.push(`/pay/single/amount?${params.toString()}`);
  }
  
  const handleShare = async () => {
    if (!transaction) return;
    setIsGenerating(true);
    try {
      const result = await generateProofOfPaymentAction(transaction);
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      const pdfBytes = result;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `proof-of-payment-${transaction.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Download Started',
        description: 'Your proof of payment is downloading.',
      });

    } catch (e: any) {
        console.error("Failed to generate and download PDF:", e);
        toast({
          variant: 'destructive',
          title: 'Download Failed',
          description: e.message || 'An unknown error occurred.',
        });
    } finally {
        setIsGenerating(false);
    }
  };


  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!transaction) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <p className="text-xl text-destructive-foreground bg-destructive p-4 rounded-md">Transaction not found.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Transaction details</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-2">
        <DetailRow label="Their reference" value={transaction.recipientReference} />
        <DetailRow label="Transaction date" value={format(new Date(transaction.date), 'dd MMMM yyyy')} />
        <DetailRow label="Amount" value={formatCurrency(transaction.amount, account?.currency)} />
        <DetailRow label="Transaction Type" value="Payment" />
        <DetailRow label="Bank name" value={transaction.bank} />
        <DetailRow label="Account number" value={transaction.accountNumber} />
      </main>

      <footer className="p-4 bg-white border-t sticky bottom-0 z-10 space-y-2">
        <Button onClick={handlePayAgain} className="w-full font-bold h-12">
          Pay again
        </Button>
        <Button onClick={handleShare} variant="outline" className="w-full font-bold h-12" disabled={isGenerating}>
            {isGenerating ? (
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Share2 className="mr-2 h-5 w-5" />
            )}
            {isGenerating ? 'Generating...' : 'Share proof of payment'}
        </Button>
      </footer>
    </div>
  );
}


export default function TransactionDetailsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <TransactionDetailsContent />
        </Suspense>
    )
}
