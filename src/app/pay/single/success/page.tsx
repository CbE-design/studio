
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/app/lib/data';
import { createTransactionAction } from '@/app/lib/actions';
import { useAuth } from '@/firebase';

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
    const auth = useAuth();

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
        if (transactionRecorded.current || !auth) return;
        
        const recordTransaction = async () => {
            if (!paymentDetails.fromAccountId || !paymentDetails.amount) {
                 toast({
                    variant: 'destructive',
                    title: "Recording Failed",
                    description: "Missing required details to save the transaction.",
                });
                return;
            }

            try {
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) {
                    throw new Error("Authentication token not found.");
                }

                // Create a temporary fetch function that includes the auth header.
                const authenticatedCreateTransaction = (data: any) => {
                    // In a real app this would be a fetch call to a backend endpoint
                    // For server actions, we'll pass the token in the headers for the action to use.
                    // This requires a bit of a workaround on the action side.
                    return fetch('/api/transaction', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify(data),
                    }).then(res => res.json());
                };
                
                const result = await createTransactionAction({
                    fromAccountId: paymentDetails.fromAccountId,
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
                toast({
                    variant: 'destructive',
                    title: "Transaction Failed",
                    description: e.message || "An unexpected error occurred.",
                });
            }
        };

        recordTransaction();
        transactionRecorded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth]);
    
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
