
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

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
        <p className="text-lg text-gray-800">{value}</p>
    </div>
);

function ReviewPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paymentDetails = {
        bankName: searchParams.get('bankName'),
        accountNumber: searchParams.get('accountNumber'),
        recipientName: searchParams.get('recipientName'),
        yourReference: searchParams.get('yourReference'),
        recipientReference: searchParams.get('recipientReference'),
        paymentType: searchParams.get('paymentType'),
        amount: searchParams.get('amount'),
        fromAccount: searchParams.get('fromAccount'),
    };

    const handlePay = () => {
        const params = new URLSearchParams();
        Object.entries(paymentDetails).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        router.push(`/pay/single/success?${params.toString()}`);
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10">
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
                    <DetailRow label="Amount" value={`R${paymentDetails.amount}`} />
                    <DetailRow label="From account" value={paymentDetails.fromAccount} />
                    <DetailRow label="Payment date" value={format(new Date(), 'dd MMMM yyyy')} />
                    <DetailRow label="Your reference" value={paymentDetails.yourReference} />
                    <DetailRow label="Recipient's reference" value={paymentDetails.recipientReference} />
                </div>
            </main>

            <footer className="p-4 bg-white border-t sticky bottom-0">
                <Button onClick={handlePay} className="w-full bg-primary hover:bg-primary/90 font-bold text-lg h-12">
                    Pay
                </Button>
            </footer>
        </div>
    )
}

export default function ReviewPaymentPage() {
    return (
        <Suspense fallback={<div>Loading payment details...</div>}>
            <ReviewPaymentContent />
        </Suspense>
    )
}
