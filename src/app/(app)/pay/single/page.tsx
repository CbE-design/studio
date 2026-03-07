'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Landmark, Smartphone, Info, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'link';

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
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-start px-2">
          <h1 className="text-3xl font-semibold leading-tight text-left">
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
        <div className="bg-gray-50 pb-32 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl min-h-screen">
            <div className="p-6 pt-8 space-y-3">
              <Label htmlFor="recipient-name" className="text-sm text-gray-500 font-bold uppercase tracking-wider">A new recipient</Label>
              <Input 
                id="recipient-name" 
                value={recipientName} 
                onChange={e => setRecipientName(e.target.value)} 
                placeholder="Enter name and surname" 
                className="bg-white border-gray-300 h-14 text-lg px-4" 
              />
            </div>

            <div className="border-t border-b border-gray-200 bg-white">
              <button 
                onClick={() => router.push('/recipients')}
                className="flex items-center w-full px-6 py-5 border-b border-gray-100 text-left hover:bg-gray-50"
              >
                <Users className="h-6 w-6 mr-4 text-primary" />
                <span className="flex-1 text-base text-gray-700 font-semibold">Select from saved recipients</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button 
                className="flex items-center w-full px-6 py-5 text-left hover:bg-gray-50"
              >
                <Smartphone className="h-6 w-6 mr-4 text-primary" />
                <span className="flex-1 text-base text-gray-700 font-semibold">Select from phone contacts</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 pt-10 space-y-6">
              <div className="space-y-4">
                <h2 className="font-bold text-sm text-gray-800 uppercase tracking-widest">To which account?</h2>
                <div className="space-y-2">
                    <Label htmlFor="bank-name" className="text-xs text-gray-500 font-bold uppercase">Bank name</Label>
                    <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-bank')}>
                    <Input 
                        id="bank-name" 
                        value={bankName} 
                        readOnly 
                        placeholder="Select bank" 
                        className="pr-10 cursor-pointer bg-white border-gray-300 h-14 text-lg px-4 font-medium"
                    />
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number" className="text-xs text-gray-500 font-bold uppercase">Account number</Label>
                    <Input 
                      id="account-number" 
                      value={accountNumber} 
                      onChange={e => setAccountNumber(e.target.value)} 
                      className="bg-white border-gray-300 h-14 text-lg px-4" 
                    />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-bold text-sm text-gray-800 uppercase tracking-widest">Payment type?</h2>
                <div className="space-y-2">
                    <Label htmlFor="payment-method" className="text-xs text-gray-500 font-bold uppercase">Payment method</Label>
                    <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}>
                    <Input 
                      id="payment-method" 
                      value={paymentType} 
                      readOnly 
                      className="pr-10 border-primary cursor-pointer bg-white h-14 text-lg px-4 font-medium text-primary" 
                    />
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <Alert className="bg-blue-50 border-blue-100 p-5">
                  <Info className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-sm text-gray-600 leading-relaxed ml-2">
                  Before you click Next, please make sure that your recipient&apos;s account information is correct. Nedbank doesn&apos;t validate account numbers or refund payments to a wrong recipient.
                  </AlertDescription>
              </Alert>
            </div>
            
            <div className="px-6 pb-10 flex items-center justify-between">
              <Label htmlFor="save-recipient" className="text-base text-gray-800 font-bold">Save recipient</Label>
              <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} className="scale-110" />
            </div>

            <div className="px-6 pb-12">
              <Button 
                  className="w-full font-bold h-14 text-lg shadow-lg bg-primary hover:bg-primary/90"
                  disabled={!isFormValid}
                  onClick={handleNext}
              >
                Next
              </Button>
            </div>
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

export default function SinglePaymentPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <SinglePaymentForm />
        </Suspense>
    );
}