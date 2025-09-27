
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentTypeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Create a stable copy of searchParams for dependency array
  const preservedSearchParams = new URLSearchParams(searchParams.toString());

  const handleSelect = (paymentType: string) => {
    // Use the preserved params to ensure we don't lose any existing state
    preservedSearchParams.set('paymentType', paymentType);
    router.push(`/pay/single?${preservedSearchParams.toString()}`);
  };
  
  const isNedbank = (preservedSearchParams.get('bank') || '').toLowerCase() === 'nedbank';

  const paymentTypes = [
    {
      name: 'Standard EFT',
      description: 'Clears within 48 hours',
      enabled: true,
    },
    {
      name: 'Instant Pay',
      description: isNedbank
        ? "Not available for recipient's bank"
        : 'Takes up to 30 minutes up to an hour to reflect',
      enabled: !isNedbank,
    },
    {
      name: 'PayShap',
      description: 'Clears immediately at a fee',
      enabled: true,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Payment Type</h1>
      </header>

      <main className="flex-1 overflow-y-auto pt-4">
        <div className="bg-white">
          {paymentTypes.map((type, index) => (
            <div
              key={type.name}
              onClick={() => type.enabled && handleSelect(type.name)}
              className={`p-4 ${type.enabled ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'} ${index < paymentTypes.length - 1 ? 'border-b' : ''}`}
            >
              <h2 className={`font-semibold ${type.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                {type.name}
              </h2>
              <p className="text-sm text-gray-400">{type.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
);

export default function SelectPaymentTypePage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentTypeSelector />
        </Suspense>
    );
}
