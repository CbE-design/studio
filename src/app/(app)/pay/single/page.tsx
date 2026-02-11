

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
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    router.push(`/pay/single/amount?${params.toString()}`);
  }

  const isFormValid = useMemo(() => {
    return bankName && accountNumber && recipientName;
  }, [bankName, accountNumber, recipientName]);


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground px-4 pt-3 pb-6 sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="-ml-2 mb-1" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold leading-tight">Whom would you like<br />to pay?</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-2">
          <Label htmlFor="recipient-name" className="text-xs text-gray-500 font-semibold">A new recipient</Label>
          <Input id="recipient-name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name and surname" className="bg-white" />
        </div>

        <div className="border-t border-b border-gray-200 bg-white">
          <Link href="/recipients">
            <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
              <Users className="h-5 w-5 mr-3 text-gray-500" />
              <span className="flex-1 text-sm text-gray-700">Select from saved recipients</span>
            </div>
          </Link>
          <Link href="#">
            <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
              <Landmark className="h-5 w-5 mr-3 text-gray-500" />
              <span className="flex-1 text-sm text-gray-700">Select from bank-approved recipients</span>
            </div>
          </Link>
          <Link href="#">
            <div className="flex items-center px-4 py-3.5">
              <Smartphone className="h-5 w-5 mr-3 text-gray-500" />
              <span className="flex-1 text-sm text-gray-700">Select from phone contacts</span>
            </div>
          </Link>
        </div>
        
        <div className="p-4 pt-6 border-b border-gray-200">
          <h2 className="font-semibold text-sm text-gray-800 mb-4">How would you like to pay?</h2>
          <div className="flex justify-center pb-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 flex flex-col items-center justify-center cursor-pointer">
              <div className="bg-primary rounded-lg p-4 mb-3 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16"/>
                  <path d="M2 18V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9"/>
                  <path d="M4 18v-5"/><path d="M8 18v-5"/><path d="M12 18v-5"/><path d="M16 18v-5"/><path d="M20 18v-5"/>
                  <path d="m2 9 10-4 10 4"/>
                </svg>
              </div>
              <span className="text-sm text-center font-medium text-gray-800">Pay to a<br />bank account</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800">To which account?</h2>
          <div className="space-y-1">
            <Label htmlFor="bank-name" className="text-xs text-gray-500 font-semibold">Bank name</Label>
            <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-bank')}>
              <Input 
                id="bank-name" 
                value={bankName} 
                readOnly 
                placeholder="Select bank" 
                className="pr-10 cursor-pointer bg-white"
              />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-number" className="text-xs text-gray-500 font-semibold">Account number</Label>
            <Input id="account-number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="bg-white" />
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800">Payment type?</h2>
          <div className="space-y-1">
            <Label htmlFor="payment-method" className="text-xs text-gray-500 font-semibold">Payment method</Label>
            <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}>
              <Input id="payment-method" value={paymentType} readOnly className="pr-10 border-primary cursor-pointer bg-white" />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Alert className="bg-blue-50 border-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-gray-600">
              Before you click Next, please make sure that your recipient&apos;s account information is correct. Nedbank doesn&apos;t validate account numbers or refund payments to a wrong recipient.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="px-4 pb-6 flex items-center justify-between">
          <Label htmlFor="save-recipient" className="text-sm text-gray-800">Save recipient</Label>
          <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} />
        </div>
      </main>

      <footer className="p-4 bg-white border-t sticky bottom-0 z-20">
        <Button 
            className="w-full font-bold"
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
