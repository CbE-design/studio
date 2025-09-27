
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Landmark, Smartphone, Info, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Account } from '@/app/lib/definitions';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { collection, query } from 'firebase/firestore';


const BankIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16"/>
        <path d="M2 18V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9"/>
        <path d="M4 18v-5"/>
        <path d="M8 18v-5"/>
        <path d="M12 18v-5"/>
        <path d="M16 18v-5"/>
        <path d="M20 18v-5"/>
        <path d="m2 9 10-4 10 4"/>
    </svg>
  );

function SinglePaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);

  const { data: userAccounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

  const [fromAccount, setFromAccount] = useState<string>('');
  const [amount, setAmount] = useState('0.00');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [yourReference, setYourReference] = useState('');
  const [recipientReference, setRecipientReference] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [paymentType, setPaymentType] = useState('Standard EFT');
  
  // Update state from URL params and set default account
  useEffect(() => {
    // This effect runs once on mount and whenever searchParams change.
    // It populates the form state from URL query parameters.
    
    // Set default 'from' account if not already set and accounts are loaded
    if (!fromAccount && userAccounts && userAccounts.length > 0) {
        setFromAccount(userAccounts[0].id);
    }

    // Restore state from query parameters
    const queryAmount = searchParams.get('amount');
    if (queryAmount) setAmount(queryAmount);

    const queryBank = searchParams.get('bank');
    if (queryBank) setBankName(decodeURIComponent(queryBank));
    
    const queryAccountNumber = searchParams.get('accountNumber');
    if (queryAccountNumber) setAccountNumber(queryAccountNumber);
    
    const queryRecipientName = searchParams.get('recipientName');
    if (queryRecipientName) setRecipientName(queryRecipientName);
    
    const queryYourReference = searchParams.get('yourReference');
    if (queryYourReference) setYourReference(queryYourReference);
    
    const queryRecipientReference = searchParams.get('recipientReference');
    if (queryRecipientReference) setRecipientReference(queryRecipientReference);

    const queryPaymentType = searchParams.get('paymentType');
    if (queryPaymentType) setPaymentType(decodeURIComponent(queryPaymentType));
    
  // We only want this to re-run when params or accounts change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userAccounts]);

  const preserveStateAndNavigate = (pathname: string) => {
      const params = new URLSearchParams(searchParams.toString());
      // Persist all state fields into query params
      params.set('fromAccount', fromAccount);
      params.set('amount', amount);
      params.set('bankName', bankName);
      params.set('accountNumber', accountNumber);
      params.set('recipientName', recipientName);
      params.set('yourReference', yourReference);
      params.set('recipientReference', recipientReference);
      params.set('paymentType', paymentType);

      router.push(`${pathname}?${params.toString()}`);
  }

  const handleNext = () => {
    const selectedAccount = userAccounts?.find(acc => acc.id === fromAccount);
    const params = new URLSearchParams({
        fromAccountId: fromAccount,
        bankName,
        accountNumber,
        recipientName,
        yourReference,
        recipientReference,
        paymentType,
        amount,
        fromAccount: selectedAccount?.name || 'Unknown Account',
    });
    router.push(`/pay/single/review?${params.toString()}`);
  }

  const isFormValid = useMemo(() => {
    return fromAccount && parseFloat(amount) > 0 && bankName && accountNumber && recipientName;
  }, [fromAccount, amount, bankName, accountNumber, recipientName]);


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Whom would you like to pay?</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
             <div>
                <Label htmlFor="from-account" className="text-xs text-gray-500 font-semibold">From account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount} disabled={isAccountsLoading}>
                    <SelectTrigger id="from-account" className="mt-1 bg-white">
                        <SelectValue placeholder={isAccountsLoading ? "Loading accounts..." : "Select an account"} />
                    </SelectTrigger>
                    <SelectContent>
                        {userAccounts?.map(account => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="amount" className="text-xs text-gray-500 font-semibold">Amount</Label>
                <Input id="amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className="mt-1 bg-white" />
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <Label htmlFor="recipient-name" className="text-xs text-gray-500 font-semibold">A new recipient</Label>
                <Input id="recipient-name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name and surname" className="mt-1 bg-white" />
            </div>

            <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <span className="flex-1 text-gray-700">Select from saved recipients</span>
            </div>
             <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                <Landmark className="h-5 w-5 mr-3 text-primary" />
                <span className="flex-1 text-gray-700">Select from bank-approved recipients</span>
            </div>
             <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                <Smartphone className="h-5 w-5 mr-3 text-primary" />
                <span className="flex-1 text-gray-700">Select from phone contacts</span>
            </div>
        </div>
        
        <div className="space-y-2">
            <h2 className="font-semibold text-gray-800">How would you like to pay?</h2>
            <div className="flex justify-center">
                <div className="bg-primary text-primary-foreground p-4 rounded-lg flex flex-col items-center justify-center w-36 h-28 cursor-pointer shadow-md">
                    <BankIcon />
                    <span className="text-sm text-center mt-2">Pay to a bank account</span>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">To which account?</h2>
            <div className="space-y-2">
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
            <div className="space-y-2">
                <Label htmlFor="account-number" className="text-xs text-gray-500 font-semibold">Account number</Label>
                <Input id="account-number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="" className="bg-white" />
            </div>

             <div className="space-y-2">
                <Label htmlFor="your-reference" className="text-xs text-gray-500 font-semibold">Your reference (optional)</Label>
                <Input id="your-reference" value={yourReference} onChange={e => setYourReference(e.target.value)} className="bg-white" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recipient-reference" className="text-xs text-gray-500 font-semibold">Recipient's reference (optional)</Label>
                <Input id="recipient-reference" value={recipientReference} onChange={e => setRecipientReference(e.target.value)} className="bg-white" />
            </div>

            <h2 className="font-semibold text-gray-800 pt-2">Payment type?</h2>
            <div className="space-y-2">
                 <Label htmlFor="payment-method" className="text-xs text-gray-500 font-semibold">Payment method</Label>
                <div className="relative" onClick={() => preserveStateAndNavigate('/pay/single/select-payment-type')}>
                    <Input id="payment-method" value={paymentType} readOnly className="pr-10 border-primary cursor-pointer bg-white" />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
            </div>
        </div>

        <Alert className="bg-primary/10 border-none text-gray-700">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription className="text-xs">
                Before you click Next, please make sure that your recipient's account information is correct. Nedbank doesn't validate account numbers or refund payments to a wrong recipient.
            </AlertDescription>
        </Alert>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
            <Label htmlFor="save-recipient" className="font-semibold text-gray-800">Save recipient</Label>
            <Switch id="save-recipient" checked={saveRecipient} onCheckedChange={setSaveRecipient} />
        </div>

      </main>
      <footer className="p-4 bg-white border-t sticky bottom-0">
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
