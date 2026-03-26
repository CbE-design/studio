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
    <div className="relative h-screen overflow-y-auto bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-10 brand-header text-primary-foreground px-4 pt-6 pb-10 flex flex-col">
        <div className="flex items-start mb-4">
          <Button variant="ghost" size="icon" className="-ml-2 text-white hover:bg-white/20" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <h1 className="text-3xl font-semibold leading-tight">
          Whom would you like<br />to pay?
        </h1>
      </header>

      <main className="flex-1 bg-white">

        {/* A new recipient */}
        <div className="px-4 pt-6 pb-4">
          <p className="text-xs text-gray-500 mb-2">A new recipient</p>
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
            className="flex items-center w-full px-4 py-4 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100"
          >
            <Users className="h-6 w-6 mr-4 text-primary" />
            <span className="flex-1 text-base text-gray-700">Select from saved recipients</span>
          </button>
          <button
            className="flex items-center w-full px-4 py-4 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100"
          >
            <Building2 className="h-6 w-6 mr-4 text-primary" />
            <span className="flex-1 text-base text-gray-700">Select from bank-approved recipients</span>
          </button>
          <button
            className="flex items-center w-full px-4 py-4 text-left hover:bg-gray-50 active:bg-gray-100"
          >
            <Smartphone className="h-6 w-6 mr-4 text-primary" />
            <span className="flex-1 text-base text-gray-700">Select from phone contacts</span>
          </button>
        </div>

        {/* How would you like to pay? */}
        <div className="px-4 pt-6 pb-4 bg-gray-50">
          <p className="text-base font-semibold text-gray-800 mb-4">How would you like to pay?</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-primary rounded-xl p-4 w-32 h-28 cursor-pointer">
              <Landmark className="h-8 w-8 text-white mb-2" />
              <span className="text-white text-xs text-center font-medium leading-tight">Pay to a bank account</span>
            </div>
          </div>
        </div>

        {/* To which account? */}
        <div className="px-4 pt-4 pb-2 bg-white">
          <p className="text-base font-semibold text-gray-800 mb-4">To which account?</p>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Bank name</p>
            <div
              className="flex items-center justify-between border border-gray-300 rounded-md h-12 px-3 cursor-pointer bg-white"
              onClick={() => preserveStateAndNavigate('/pay/single/select-bank')}
            >
              <span className={bankName ? 'text-base text-gray-800' : 'text-base text-gray-400'}>
                {bankName || 'Select bank'}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Account number</p>
            <Input
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder=""
              className="h-12 border-gray-300 rounded-md text-base"
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Payment type? */}
        <div className="px-4 pt-2 pb-4 bg-white">
          <p className="text-base font-semibold text-gray-800 mb-4">Payment type?</p>
          <div className="mb-1">
            <p className="text-xs text-gray-500 mb-1">Payment method</p>
            <div
              className="flex items-center justify-between border-2 border-primary rounded-md h-12 px-3 cursor-pointer bg-white"
              onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}
            >
              <span className="text-base text-primary font-semibold">{paymentType}</span>
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Info alert */}
        <div className="flex items-start gap-3 px-4 py-4 bg-gray-50 border-t border-gray-100">
          <Info className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">
            Before you click Next, please make sure that your recipient&apos;s account information is correct. Nedbank doesn&apos;t validate account numbers or refund payments to a wrong recipient.
          </p>
        </div>

        {/* Save recipient toggle */}
        <div className="flex items-center justify-between px-4 py-4 bg-white border-t border-gray-100">
          <Label htmlFor="save-recipient" className="text-base text-gray-700">Save recipient</Label>
          <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} />
        </div>

        {/* Next button */}
        <div className="px-4 py-4 bg-white border-t border-gray-100">
          <Button
            className="w-full font-semibold h-12 text-base rounded-md"
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
