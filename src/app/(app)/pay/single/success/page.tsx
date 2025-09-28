
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Share2, LoaderCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/app/lib/data';
import { createTransactionAction } from '@/app/lib/actions';
import { useUser } from '@/firebase-provider';

const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
    <div className="py-4 border-b last:border-b-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg text-gray-800">{value}</p>
    </div>
);

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const transactionRecorded = useRef(false);
    const { user, isUserLoading } = useUser();
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    const paymentDetails = {
        fromAccountId: searchParams.get('fromAccountId'),
        bankName: searchParams.get('bankName'),
        accountNumber: searchParams.get('accountNumber'),
        recipientName: searchParams.get('recipientName'),
        yourReference: searchParams.get('yourReference'),
        recipientReference: searchParams.get('recipientReference'),
        amount: searchParams.get('amount'),
    };

    useEffect(() => {
        setFormattedDate(format(new Date(), 'dd MMMM yyyy'));

        // Do not proceed if the transaction is already recorded, if data is loading, or if no user is present.
        if (transactionRecorded.current || isUserLoading || !user) {
            return;
        }
        
        const recordTransaction = async () => {
            console.log('Attempting to record transaction...');
            if (!paymentDetails.fromAccountId || !paymentDetails.amount) {
                 toast({
                    variant: 'destructive',
                    title: "Recording Failed",
                    description: "Missing required details to save the transaction.",
                });
                console.error('Missing fromAccountId or amount');
                return;
            }

            try {
                const result = await createTransactionAction({
                    fromAccountId: paymentDetails.fromAccountId,
                    userId: user.uid, // Pass the user's UID
                    amount: paymentDetails.amount,
                    recipientName: paymentDetails.recipientName || undefined,
                    yourReference: paymentDetails.yourReference || undefined,
                    recipientReference: paymentDetails.recipientReference || undefined,
                });
    
                if (result.message === 'Transaction created successfully.') {
                    toast({
                        title: "Transaction Recorded",
                        description: "Your payment has been successfully processed and recorded.",
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: "Transaction Failed",
                        description: result.message,
                    });
                }
            } catch (e: any) {
                console.error("Error in createTransactionAction:", e);
                toast({
                    variant: 'destructive',
                    title: "Transaction Failed",
                    description: e.message || "An unexpected error occurred.",
                });
            }
        };

        recordTransaction();
        transactionRecorded.current = true; // Mark as recorded to prevent re-triggering.
    // The dependency array is crucial. The effect will re-run if these values change.
    // We need it to run when isUserLoading becomes false and user is available.
    }, [user, isUserLoading, paymentDetails.fromAccountId, paymentDetails.amount, paymentDetails.recipientName, paymentDetails.yourReference, paymentDetails.recipientReference, toast]);
    
    const handleShare = () => {
        const params = new URLSearchParams();
        Object.entries(paymentDetails).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        router.push(`/pay/single/share?${params.toString()}`);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="gradient-background text-primary-foreground p-6 text-center h-48 flex flex-col justify-center items-center">
                <div className="h-16 w-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Check className="h-10 w-10" />
                </div>
                <h1 className="text-xl">
                    {`${formatCurrency(Number(paymentDetails.amount))} paid to ${paymentDetails.recipientName}'s bank account`}
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-2">
                 <DetailRow label="Payment date" value={formattedDate} />
                 <DetailRow label="Bank name" value={paymentDetails.bankName} />
                 <DetailRow label="Account number" value={paymentDetails.accountNumber} />
                 <DetailRow label="Your reference" value={paymentDetails.yourReference} />
                 <DetailRow label="Recipient's reference" value={paymentDetails.recipientReference} />
            </main>
            
             <footer className="p-4 bg-white sticky bottom-0">
                <div className="flex flex-col items-center justify-center space-y-4">
                     <Button variant="link" className="text-primary text-lg font-semibold" onClick={handleShare}>
                        <Share2 className="mr-2 h-5 w-5" />
                        Share proof of payment
                    </Button>
                    <Button className="w-full bg-primary hover:bg-primary/90 font-bold h-12" onClick={() => router.push('/dashboard')}>
                        Done
                    </Button>
                </div>
            </footer>
        </div>
    );
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
);


export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
