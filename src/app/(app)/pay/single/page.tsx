'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Landmark, Smartphone, Info, LoaderCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  };

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
  };

  const isFormValid = useMemo(() => {
    return bankName && accountNumber && recipientName;
  }, [bankName, accountNumber, recipientName]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <header className="p-4 pt-6">
          <Button variant="ghost" size="icon" className="-ml-2 mb-2" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 px-2 pb-6">Whom would you like to pay?</h1>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b">
          {/* A new recipient */}
          <div className="px-6 pt-6 pb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">A new recipient</p>
            <Input
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Enter name and surname"
              className="h-12 border-gray-300 rounded-md text-base"
            />
          </div>

          {/* Recipient selection options */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => router.push('/recipients')}
              className="flex items-center w-full px-6 py-4 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <Users className="h-6 w-6 mr-4 text-primary" />
              <span className="flex-1 text-base text-gray-700 font-medium">Select from saved recipients</span>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
            <button
              className="flex items-center w-full px-6 py-4 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <Building2 className="h-6 w-6 mr-4 text-primary" />
              <span className="flex-1 text-base text-gray-700 font-medium">Select from bank-approved recipients</span>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
            <button
              className="flex items-center w-full px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <Smartphone className="h-6 w-6 mr-4 text-primary" />
              <span className="flex-1 text-base text-gray-700 font-medium">Select from phone contacts</span>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* How would you like to pay? */}
        <div className="px-6 pt-8 pb-4">
          <p className="text-lg font-bold text-gray-800 mb-4">How would you like to pay?</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-primary rounded-2xl p-4 w-36 h-32 cursor-pointer shadow-sm">
              <Landmark className="h-8 w-8 text-white mb-2" />
              <span className="text-white text-xs text-center font-bold leading-tight">Pay to a bank account</span>
            </div>
          </div>
        </div>

        {/* To which account? */}
        <div className="px-6 pt-4 pb-2 bg-white border-y">
          <p className="text-lg font-bold text-gray-800 mb-4 mt-2">To which account?</p>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bank name</p>
            <div
              className="flex items-center justify-between border border-gray-300 rounded-lg h-14 px-4 cursor-pointer bg-white hover:border-primary transition-colors"
              onClick={() => preserveStateAndNavigate('/pay/single/select-bank')}
            >
              <span className={bankName ? 'text-base text-gray-800 font-medium' : 'text-base text-gray-400'}>
                {bankName || 'Select bank'}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account number</p>
            <Input
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="e.g. 1234567890"
              className="h-14 border-gray-300 rounded-lg text-base"
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Payment type? */}
        <div className="px-6 pt-6 pb-6 bg-white border-b">
          <p className="text-lg font-bold text-gray-800 mb-4">Payment type?</p>
          <div className="mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment method</p>
            <div
              className="flex items-center justify-between border-2 border-primary rounded-lg h-14 px-4 cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
              onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}
            >
              <span className="text-base text-primary font-bold">{paymentType}</span>
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Info alert */}
        <div className="flex items-start gap-3 px-6 py-6 bg-gray-50 border-b">
          <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Before you click Next, please make sure that your recipient&apos;s account information is correct. Nedbank doesn&apos;t validate account numbers or refund payments to a wrong recipient.
          </p>
        </div>

        {/* Save recipient toggle */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b">
          <Label htmlFor="save-recipient" className="text-base text-gray-700 font-semibold">Save recipient</Label>
          <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} className="data-[state=checked]:bg-primary" />
        </div>

        {/* Next button footer */}
        <div className="px-6 py-8 bg-gray-50">
          <Button
            className="w-full font-bold h-14 text-lg rounded-xl shadow-lg transition-transform active:scale-95"
            disabled={!isFormValid}
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
  </div>
);

export default function SinglePaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SinglePaymentForm />
    </Suspense>
  );
}
