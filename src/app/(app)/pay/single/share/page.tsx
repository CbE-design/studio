
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const shareOptions = [
  { icon: Mail, label: 'Email' },
  { icon: MessageSquare, label: 'WhatsApp' },
  { icon: Send, label: 'SMS' },
];

function ShareProofOfPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleShare = (option: string) => {
    // In a real app, this would trigger the native share functionality.
    // For this prototype, we'll navigate to the proof of payment page.
    const params = new URLSearchParams(searchParams.toString());
    router.push(`/pay/single/proof?${params.toString()}`);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Share Proof of Payment</h1>
      </header>

      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {shareOptions.map((option, index) => (
            <div
              key={option.label}
              onClick={() => handleShare(option.label)}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${index < shareOptions.length - 1 ? 'border-b' : ''}`}
            >
              <option.icon className="h-6 w-6 mr-4 text-primary" />
              <span className="text-lg font-medium text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ShareProofOfPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ShareProofOfPaymentContent />
        </Suspense>
    )
}
