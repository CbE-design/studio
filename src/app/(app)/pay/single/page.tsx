'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Landmark, Smartphone, Info, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function SinglePaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [yourReference, setYourReference] = useState('');
  const [recipientReference, setRecipientReference] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [paymentType, setPaymentType] = useState('Standard EFT');

  useEffect(() => {
    const queryBank = searchParams.get('bank');
    if (queryBank) setBankName(decodeURIComponent(queryBank));
    
    const queryAccountNumber = searchParams.get('accountNumber');
    if (queryAccountNumber) setAccountNumber(queryAccountNumber);
    
    const queryRecipientName = searchParams.get('recipientName');
    if (queryRecipientName) setRecipientName(decodeURIComponent(queryRecipientName));
    
    const queryYourReference = searchParams.get('yourReference');
    if (queryYourReference) setYourReference(decodeURIComponent(queryYourReference));
    
    const queryRecipientReference = searchParams.get('recipientReference');
    if (queryRecipientReference) setRecipientReference(decodeURIComponent(queryRecipientReference));

    const queryPaymentType = searchParams.get('paymentType');
    if (queryPaymentType) setPaymentType(decodeURIComponent(queryPaymentType));
    
  }, [searchParams]);

  const preserveStateAndNavigate = (pathname: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('bank', bankName);
      params.set('accountNumber', accountNumber);
      params.set('recipientName', recipientName);
      params.set('yourReference', yourReference);
      params.set('recipientReference', recipientReference);
      params.set('paymentType', paymentType);

      router.push(`${pathname}?${params.toString()}`);
  }

  const handleNext = () => {
    const params = new URLSearchParams();
    params.set('bankName', bankName);
    params.set('accountNumber', accountNumber);
    params.set('recipientName', recipientName);
    params.set('yourReference', yourReference);
    params.set('recipientReference', recipientReference);
    params.set('paymentType', paymentType);
    params.set('saveRecipient', saveRecipient.toString());
    router.push(`/pay/single/amount?${params.toString()}`);
  }

  const isFormValid = useMemo(() => {
    return bankName && accountNumber && recipientName;
  }, [bankName, accountNumber, recipientName]);


  return (
    <div className="relative h-screen overflow-y-auto bg-gray-50 flex flex-col scroll-smooth">
      {/* 
          Sticky Header with lower z-index (z-0). 
          The main section below will slide over it as the user scrolls.
      */}
      <header className="sticky top-0 z-0 h-64 gradient-background text-primary-foreground px-4 pt-6 pb-8 flex flex-col">
        <div className="flex items-start mb-2">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-start px-2">
          <h1 className="text-2xl font-semibold leading-tight text-left">
            Whom would you like<br />to pay?
          </h1>
        </div>
      </header>
      
      {/* 
          Main Content Section with higher z-index (z-10). 
          It uses negative margin (-mt-64) to start at the top of the header,
          and padding-top (pt-64) to push the content below the visible header text.
          As the page scrolls, the solid background slides OVER the header.
      */}
      <main className="relative z-10 -mt-64 pt-64 flex-1">
        <div className="bg-gray-50 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl min-h-screen">
            <div className="p-4 pt-8 space-y-2">
              <Label htmlFor="recipient-name" className="text-xs text-gray-500 font-semibold uppercase">A new recipient</Label>
              <Input id="recipient-name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name and surname" className="bg-white border-gray-300" />
            </div>

            <div className="border-t border-b border-gray-200 bg-white">
              <Link href="/recipients">
                  <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
                  <Users className="h-5 w-5 mr-3 text-gray-500" />
                  <span className="flex-1 text-sm text-gray-700 font-medium">Select from saved recipients</span>
                  </div>
              </Link>
              <Link href="#">
                  <div className="flex items-center px-4 py-3.5">
                  <Smartphone className="h-5 w-5 mr-3 text-gray-500" />
                  <span className="flex-1 text-sm text-gray-700 font-medium">Select from phone contacts</span>
                  </div>
              </Link>
            </div>
            
            <div className="p-4 pt-6 flex justify-center">
                <div className="w-40 h-40 bg-[#00A651] text-white font-semibold p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                    <Landmark className="h-8 w-8 mb-2" />
                    <p className="text-sm">Pay to a bank account</p>
                </div>
            </div>

            <div className="p-4 space-y-4">
              <h2 className="font-semibold text-sm text-gray-800 uppercase">To which account?</h2>
              <div className="space-y-1">
                  <Label htmlFor="bank-name" className="text-xs text-gray-500 font-semibold uppercase">Bank name</Label>
                  <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-bank')}>
                  <Input 
                      id="bank-name" 
                      value={bankName} 
                      readOnly 
                      placeholder="Select bank" 
                      className="pr-10 cursor-pointer bg-white border-gray-300"
                  />
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
              </div>
              <div className="space-y-1">
                  <Label htmlFor="account-number" className="text-xs text-gray-500 font-semibold uppercase">Account number</Label>
                  <Input id="account-number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="bg-white border-gray-300" />
              </div>
            </div>

            <div className="px-4 pb-4 space-y-4">
              <h2 className="font-semibold text-sm text-gray-800 uppercase">Payment type?</h2>
              <div className="space-y-1">
                  <Label htmlFor="payment-method" className="text-xs text-gray-500 font-semibold uppercase">Payment method</Label>
                  <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}>
                  <Input id="payment-method" value={paymentType} readOnly className="pr-10 border-primary cursor-pointer bg-white" />
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <Alert className="bg-blue-50 border-blue-100">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-gray-600 leading-relaxed">
                  Before you click Next, please make sure that your recipient&apos;s account information is correct. Nedbank doesn&apos;t validate account numbers or refund payments to a wrong recipient.
                  </AlertDescription>
              </Alert>
            </div>
            
            <div className="px-4 pb-6 flex items-center justify-between">
              <Label htmlFor="save-recipient" className="text-sm text-gray-800 font-medium">Save recipient</Label>
              <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} />
            </div>
        </div>
      </main>

      <footer className="p-4 bg-white border-t fixed bottom-0 left-0 right-0 z-20">
        <Button 
            className="w-full font-bold h-12 text-base"
            disabled={!isFormValid}
            onClick={handleNext}
        >
          Next
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

export default function SinglePaymentPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <SinglePaymentForm />
        </Suspense>
    );
}