
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/app/lib/data';

const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
    <div className="py-4 border-b last:border-b-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg text-gray-800">{value || '-'}</p>
    </div>
);

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    const paymentDetails = {
        fromAccountId: searchParams.get('fromAccountId'),
        bankName: searchParams.get('bankName'),
        accountNumber: searchParams.get('accountNumber'),
        recipientName: searchParams.get('recipientName'),
        yourReference: searchParams.get('yourReference'),
        recipientReference: searchParams.get('recipientReference'),
        amount: searchParams.get('amount'),
        transactionId: searchParams.get('transactionId'),
    };
    
    useEffect(() => {
        setFormattedDate(format(new Date(), 'dd MMMM yyyy'));
    }, []);

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
                <Button className="w-full bg-primary hover:bg-primary/90 font-bold h-12" onClick={() => router.push('/dashboard')}>
                    Done
                </Button>
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
