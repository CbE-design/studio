
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, LoaderCircle, AlertTriangle, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase-provider';
import { doc, getDoc } from 'firebase/firestore';
import type { Account, Transaction } from '@/app/lib/definitions';
import { format } from 'date-fns';
import { formatCurrency } from '@/app/lib/data';
import { generateProofOfPaymentAction, markTransactionAsFailedAction, sendProofOfPaymentEmailAction, sendProofOfPaymentSmsAction } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="py-4 border-b last:border-b-0">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg text-gray-800">{value || '-'}</p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="flex flex-col h-screen">
    <header className="gradient-background text-white p-4 flex items-center">
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
  const [isFailing, setIsFailing] = useState(false);

  const [dialogOpen, setDialogOpen] = useState<'email' | 'sms' | null>(null);
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);

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
  
  const handleDownload = async () => {
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

  const handleMarkAsFailed = async () => {
    if (!user || !accountId || !txId || !transaction) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing required data.' });
      return;
    }
    
    setIsFailing(true);
    const result = await markTransactionAsFailedAction(user.uid, accountId as string, txId as string);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      // Redirect to the account page to see the new return transaction
      router.push(`/account/${accountId}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      setIsFailing(false);
    }
    // No need to set isFailing to false on success, as we are navigating away.
  };

  const handleSend = async () => {
    if (!transaction || !recipient) return;

    setIsSending(true);
    try {
        let result;
        if (dialogOpen === 'email') {
            result = await sendProofOfPaymentEmailAction(transaction, recipient);
        } else if (dialogOpen === 'sms') {
            result = await sendProofOfPaymentSmsAction(transaction, recipient);
        }

        if (result?.success) {
            toast({
                title: 'Sent Successfully',
                description: `Proof of payment sent to ${recipient}.`,
            });
            setDialogOpen(null);
            setRecipient('');
        } else {
            throw new Error(result?.message || 'Failed to send.');
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: `Failed to Send ${dialogOpen === 'email' ? 'Email' : 'SMS'}`,
            description: e.message || 'An unknown error occurred.',
        });
    } finally {
        setIsSending(false);
    }
  }


  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!transaction) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
        <div className="text-xl text-destructive-foreground bg-destructive p-4 rounded-md">
            <h2 className="font-bold mb-2">Transaction Not Found</h2>
            <p className="text-sm font-normal">This transaction may have been moved or deleted.</p>
        </div>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isReturnTransaction = transaction.description.startsWith('RETURN:');
  const showMarkAsFailed = !isReturnTransaction && transaction.type === 'debit';


  return (
    <Dialog onOpenChange={(isOpen) => { if (!isOpen) { setDialogOpen(null); setRecipient(''); }}}>
    <div className="flex flex-col h-screen bg-white">
      <header className="gradient-background text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Transaction details</h1>
        </div>

        {showMarkAsFailed && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={isFailing}>
                        <AlertTriangle className="h-5 w-5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create a new credit transaction to reverse the funds for this payment and log it in the failed transactions list. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkAsFailed} disabled={isFailing}>
                            {isFailing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-2">
        <DetailRow label="Description" value={transaction.description} />
        <DetailRow label="Transaction date" value={format(new Date(transaction.date), 'dd MMMM yyyy')} />
        <DetailRow label="Amount" value={formatCurrency(transaction.amount, account?.currency)} />
        <DetailRow label="Transaction Type" value={isReturnTransaction ? 'Reversal/Return' : 'Payment'} />
        {!isReturnTransaction && (
          <>
            <DetailRow label="Bank name" value={transaction.bank} />
            <DetailRow label="Account number" value={transaction.accountNumber} />
            <DetailRow label="Their reference" value={transaction.recipientReference} />
          </>
        )}
      </main>

      <footer className="p-4 bg-white border-t sticky bottom-0 z-10 space-y-2">
        {!isReturnTransaction && transaction.type === 'debit' && (
          <>
            <Button onClick={handlePayAgain} className="w-full font-bold h-12">
              Pay again
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen('email')} variant="outline" className="w-full font-bold h-12">
                  <Mail className="mr-2 h-5 w-5" /> Email
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen('sms')} variant="outline" className="w-full font-bold h-12">
                  <MessageSquare className="mr-2 h-5 w-5" /> SMS
                </Button>
              </DialogTrigger>
            </div>
             <Button onClick={handleDownload} variant="outline" className="w-full font-bold h-12" disabled={isGenerating}>
                {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                {isGenerating ? 'Downloading...' : 'Download PDF'}
            </Button>
          </>
        )}
        {(isReturnTransaction || transaction.type === 'credit') && (
           <Button onClick={() => router.back()} className="w-full font-bold h-12">
              Done
           </Button>
        )}
      </footer>

      <DialogContent>
            <DialogHeader>
                <DialogTitle>Send Proof of Payment via {dialogOpen}</DialogTitle>
                <DialogDescription>
                    Enter the recipient's {dialogOpen === 'email' ? 'email address' : 'phone number'}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipient" className="text-right">
                        {dialogOpen === 'email' ? 'Email' : 'Phone'}
                    </Label>
                    <Input
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="col-span-3"
                        placeholder={dialogOpen === 'email' ? 'name@example.com' : '+1234567890'}
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSend} disabled={isSending || !recipient}>
                    {isSending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Send
                </Button>
            </DialogFooter>
        </DialogContent>
    </div>
    </Dialog>
  );
}


export default function TransactionDetailsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <TransactionDetailsContent />
        </Suspense>
    )
}
