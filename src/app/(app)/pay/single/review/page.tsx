
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X, User, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/app/lib/data';
import { createTransactionAction } from '@/app/lib/actions';
import { useUser } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';

const RecipientIcon = () => (
    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center relative">
      <User className="h-6 w-6 text-gray-500" />
      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );


const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg text-gray-800">{value || '-'}</p>
    </div>
);

function ReviewPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const paymentDetails = {
        fromAccountId: searchParams.get('fromAccountId'),
        bankName: searchParams.get('bankName'),
        accountNumber: searchParams.get('accountNumber'),
        recipientName: searchParams.get('recipientName'),
        yourReference: searchParams.get('yourReference'),
        recipientReference: searchParams.get('recipientReference'),
        paymentType: searchParams.get('paymentType'),
        amount: searchParams.get('amount'),
        fromAccount: searchParams.get('fromAccount'),
    };
    
    const formattedDate = format(new Date(), 'dd MMMM yyyy');
    
    const handlePay = async () => {
        if (!user || !paymentDetails.fromAccountId || !paymentDetails.amount) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Cannot proceed with payment. User or account details are missing.',
            });
            return;
        }
        
        setIsProcessing(true);

        try {
            const result = await createTransactionAction({
                fromAccountId: paymentDetails.fromAccountId,
                userId: user.uid,
                amount: paymentDetails.amount,
                recipientName: paymentDetails.recipientName || undefined,
                yourReference: paymentDetails.yourReference || undefined,
                recipientReference: paymentDetails.recipientReference || undefined,
            });

            if (result.success && result.transactionId) {
                toast({
                    title: "Payment Successful",
                    description: "Your payment has been processed and recorded.",
                });

                const params = new URLSearchParams();
                Object.entries(paymentDetails).forEach(([key, value]) => {
                    if (value) params.set(key, value);
                });
                params.set('transactionId', result.transactionId);
                router.push(`/pay/single/success?${params.toString()}`);
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Payment Failed",
                    description: result.message,
                });
            }
        } catch (e: any) {
             toast({
                variant: 'destructive',
                title: "An Unexpected Error Occurred",
                description: e.message || "Could not process your payment.",
            });
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10">
                 <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">Review payment</h1>
                <Button variant="ghost" size="icon" className="-mr-2" onClick={() => router.push('/dashboard')}>
                    <X />
                </Button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md border flex items-center gap-4">
                    <RecipientIcon />
                    <div>
                        <p className="font-semibold text-gray-500 uppercase text-sm">{paymentDetails.bankName}</p>
                        <p className="font-bold text-gray-800 text-lg">{paymentDetails.recipientName}</p>
                        <p className="text-gray-500">{paymentDetails.accountNumber}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <DetailRow label="Payment type" value={paymentDetails.paymentType} />
                    <DetailRow label="Amount" value={formatCurrency(Number(paymentDetails.amount))} />
                    <DetailRow label="From account" value={paymentDetails.fromAccount} />
                    <DetailRow label="Payment date" value={formattedDate} />
                    <DetailRow label="Your reference" value={paymentDetails.yourReference} />
                    <DetailRow label="Recipient's reference" value={paymentDetails.recipientReference} />
                </div>
            </main>

            <footer className="p-4 bg-white border-t sticky bottom-0">
                <Button onClick={handlePay} className="w-full bg-primary hover:bg-primary/90 font-bold text-lg h-12" disabled={isProcessing || isUserLoading}>
                  {isProcessing ? <LoaderCircle className="animate-spin h-6 w-6" /> : 'Pay'}
                </Button>
            </footer>
        </div>
    )
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
);

export default function ReviewPaymentPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ReviewPaymentContent />
        </Suspense>
    )
}
