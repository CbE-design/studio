
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, LoaderCircle, Share2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/app/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        paymentType: searchParams.get('paymentType'),
    };
    
    useEffect(() => {
        setFormattedDate(format(new Date(), 'dd MMMM yyyy'));
    }, []);

    const isInstantPayment = paymentDetails.paymentType === 'Instant Pay' || paymentDetails.paymentType === 'PayShap';

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="gradient-background text-primary-foreground p-6 text-center h-48 flex flex-col justify-between items-center relative">
                <div className="w-full flex justify-end">
                    <Button variant="ghost" size="icon">
                        <Share2 className="h-6 w-6" />
                    </Button>
                </div>
                <div className="flex flex-col items-center">
                    <Check className="h-10 w-10 mb-2" />
                    <h1 className="text-xl text-center">
                        {`${formatCurrency(Number(paymentDetails.amount))} paid to ${paymentDetails.recipientName}'s bank account`}
                    </h1>
                </div>
                 <div className="h-6"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-2">
                 {isInstantPayment && (
                    <Alert className="bg-green-100 border-green-200 text-green-800 mb-4">
                        <Info className="h-5 w-5 text-green-700" />
                        <AlertDescription className="ml-2 text-sm">
                            Instant payments take up to 30 minutes to process. Once successful, you can share your proof of payment from payment history.
                        </AlertDescription>
                    </Alert>
                 )}

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
