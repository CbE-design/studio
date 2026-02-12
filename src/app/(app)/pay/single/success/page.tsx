

'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, LoaderCircle, Share2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/app/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import html2canvas from 'html2canvas';

const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
    <div className="py-3">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value || '-'}</p>
    </div>
);

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formattedDate, setFormattedDate] = useState<string | null>(null);
    const confirmationRef = useRef<HTMLDivElement>(null);

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

    const handleShare = useCallback(async () => {
        if (!confirmationRef.current) return;

        try {
            const canvas = await html2canvas(confirmationRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File([blob], 'payment_confirmation.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Payment Confirmation',
                        text: `Payment of ${formatCurrency(Number(paymentDetails.amount))} to ${paymentDetails.recipientName}`,
                        files: [file],
                    });
                } else if (navigator.share) {
                    await navigator.share({
                        title: 'Payment Confirmation',
                        text: `Payment of ${formatCurrency(Number(paymentDetails.amount))} paid to ${paymentDetails.recipientName}'s bank account.\nBank: ${paymentDetails.bankName}\nAccount: ${paymentDetails.accountNumber}\nDate: ${formattedDate}\nYour Ref: ${paymentDetails.yourReference || '-'}\nRecipient Ref: ${paymentDetails.recipientReference || '-'}`,
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'payment_confirmation.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Share failed:', err);
        }
    }, [paymentDetails, formattedDate]);

    return (
        <div className="flex flex-col h-screen bg-white">
            <div ref={confirmationRef}>
                <header className="gradient-background text-primary-foreground px-6 pt-4 pb-8 text-center flex flex-col items-center relative min-h-[220px] justify-center">
                    <button
                        onClick={handleShare}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Share payment confirmation"
                    >
                        <Share2 className="h-7 w-7 text-white" />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center mb-3">
                            <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-xl font-semibold text-center leading-snug px-4">
                            {`${formatCurrency(Number(paymentDetails.amount))} paid to ${paymentDetails.recipientName}'s bank account`}
                        </h1>
                    </div>
                </header>

                <main className="bg-white px-5">
                    {isInstantPayment && (
                        <div className="flex items-start gap-3 py-4 border-b border-gray-100">
                            <Info className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Instant payments take up to 30 minutes to process. Once successful, you can share your proof of payment from payment history.
                            </p>
                        </div>
                    )}

                    <DetailRow label="Payment date" value={formattedDate} />
                    <DetailRow label="Bank name" value={paymentDetails.bankName} />
                    <DetailRow label="Account number" value={paymentDetails.accountNumber} />
                    <DetailRow label="Your reference" value={paymentDetails.yourReference} />
                    <DetailRow label="Recipient's reference" value={paymentDetails.recipientReference} />
                </main>
            </div>
            
            <div className="flex-1" />
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
