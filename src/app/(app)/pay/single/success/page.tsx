
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { createTransactionAction } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
        if (transactionRecorded.current || !paymentDetails.fromAccountId || !paymentDetails.amount) return;
        
        const recordTransaction = async () => {
            const formData = new FormData();
            formData.append('fromAccountId', paymentDetails.fromAccountId!);
            formData.append('amount', paymentDetails.amount!);
            if (paymentDetails.recipientName) formData.append('recipientName', paymentDetails.recipientName);
            if (paymentDetails.yourReference) formData.append('yourReference', paymentDetails.yourReference);
            if (paymentDetails.recipientReference) formData.append('recipientReference', paymentDetails.recipientReference);

            try {
                const result = await createTransactionAction(formData);
                if (result?.message !== 'Transaction created successfully.') {
                   throw new Error(result.message || 'An unknown error occurred.');
                }
                toast({
                    title: "Transaction Recorded",
                    description: "The transaction has been saved to your account history.",
                });

            } catch (error) {
                console.error("Failed to record transaction:", error);
                toast({
                    variant: 'destructive',
                    title: "Recording Failed",
                    description: "Could not save the transaction to your history.",
                });
            }
        };

        recordTransaction();
        transactionRecorded.current = true;
    }, [searchParams, paymentDetails, toast]);
    
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
            <header className="bg-primary text-primary-foreground p-6 text-center h-48 flex flex-col justify-center items-center">
                <div className="h-16 w-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Check className="h-10 w-10" />
                </div>
                <h1 className="text-xl">
                    {`R${paymentDetails.amount} paid to ${paymentDetails.recipientName}'s bank account`}
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-2">
                 <DetailRow label="Payment date" value={format(new Date(), 'dd MMMM yyyy')} />
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


export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
