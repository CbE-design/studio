
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarIcon, ChevronRight, LoaderCircle, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, add } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account } from '@/app/lib/definitions';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}: {
  accounts: Account[];
  selectedAccount: string | null;
  onSelectAccount: (accountId: string) => void;
}) => {
  return (
    <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4">
      {accounts.map((account) => (
        <Card
          key={account.id}
          className={cn(
            'min-w-[150px] w-[150px] border-2 rounded-lg transition-all cursor-pointer',
            selectedAccount === account.id
              ? 'border-primary bg-white'
              : 'border-gray-200 bg-white'
          )}
          onClick={() => onSelectAccount(account.id)}
        >
          <CardContent className="p-0 relative flex flex-col justify-between h-full">
            <div className="p-3">
              <p
                className={cn(
                  'font-semibold text-sm',
                  selectedAccount === account.id
                    ? 'text-primary'
                    : 'text-gray-600'
                )}
              >
                {account.name.split(' ')[0].toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">{account.accountNumber.slice(-10)}</p>
            </div>
            <div
              className={cn(
                'p-3 text-white font-bold rounded-b-md',
                selectedAccount === account.id
                  ? 'bg-primary'
                  : 'bg-gray-300'
              )}
            >
              {formatCurrency(account.balance, account.currency)}
            </div>
             {selectedAccount === account.id && (
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-primary" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const LoadingSkeleton = () => (
    <div className="flex flex-col h-screen">
        <div className="gradient-background p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-6 bg-white/20" />
                <Skeleton className="h-8 w-32 bg-white/20" />
                <Skeleton className="h-6 w-6 bg-white/20" />
            </div>
             <Skeleton className="h-16 w-full bg-white/20" />
        </div>
        <div className="p-4 space-y-8">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
)


function AmountPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [amount, setAmount] = useState('0.00');
    const [yourReference, setYourReference] = useState('');
    const [recipientReference, setRecipientReference] = useState('');

    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);

    const { data: allAccounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

    const [fromAccount, setFromAccount] = useState<string | null>(null);

    const paymentDetails = {
        bankName: searchParams.get('bankName'),
        accountNumber: searchParams.get('accountNumber'),
        recipientName: searchParams.get('recipientName'),
        paymentType: searchParams.get('paymentType'),
    };
    
    // Set default values from previous page's state
    useEffect(() => {
        const yourRef = searchParams.get('yourReference');
        if (yourRef) setYourReference(yourRef);
        const recipientRef = searchParams.get('recipientReference');
        if (recipientRef) setRecipientReference(recipientRef);
    }, [searchParams]);

    // Set initial 'fromAccount' once accounts have loaded
    useEffect(() => {
        if (allAccounts && allAccounts.length > 0 && !fromAccount) {
            const currentAccount = allAccounts.find(acc => acc.type === 'Cheque');
            if (currentAccount) {
                setFromAccount(currentAccount.id);
            } else {
                setFromAccount(allAccounts[0].id);
            }
        }
    }, [allAccounts, fromAccount]);


    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setAmount(value);
    };

    const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const numberValue = parseFloat(e.target.value);
        if (!isNaN(numberValue)) {
            setAmount(numberValue.toFixed(2));
        } else {
            setAmount('0.00');
        }
    };
    
    const handleNext = () => {
        const params = new URLSearchParams();
        Object.entries(paymentDetails).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        params.set('amount', amount);
        params.set('yourReference', yourReference);
        params.set('recipientReference', recipientReference);
        if (fromAccount) {
            params.set('fromAccountId', fromAccount);
            const accountDetails = allAccounts?.find(acc => acc.id === fromAccount);
            if (accountDetails) {
                 params.set('fromAccount', `${accountDetails.name} - ${accountDetails.accountNumber}`);
            }
        }
        router.push(`/pay/single/review?${params.toString()}`);
    }

    const isLoading = isUserLoading || isAccountsLoading || !allAccounts;

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex items-start justify-between sticky top-0 z-10 flex-col h-[150px]">
                <div className="w-full flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div className="text-center">
                        <h1 className="text-xl font-semibold">Pay {paymentDetails.recipientName}</h1>
                        <p className="text-sm opacity-80">{paymentDetails.bankName}</p>
                        <p className="text-sm opacity-80">{paymentDetails.accountNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="-mr-2" onClick={() => router.push('/dashboard')}>
                        <X />
                    </Button>
                </div>
                <div className="w-full">
                    <label className="text-sm">Amount</label>
                    <div className="flex items-end">
                        <span className="text-2xl font-light mr-1">R</span>
                        <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        onBlur={handleAmountBlur}
                        className="w-full bg-transparent text-4xl font-light focus:outline-none"
                        placeholder="0.00"
                        />
                    </div>
                </div>
            </header>
            <div className="w-full h-1 bg-yellow-400"></div>
            <p className="text-xs text-center text-gray-500 py-1 bg-gray-200">R999 999.90 daily payment limit remaining</p>
            
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6">
                <div>
                    <h2 className="font-semibold text-gray-700 mb-2">From which account?</h2>
                     <AccountSelector
                        accounts={allAccounts.filter(a => a.type !== 'Credit')}
                        selectedAccount={fromAccount}
                        onSelectAccount={setFromAccount}
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700">What is the payment for?</h2>
                    <div className="space-y-2">
                        <Label htmlFor="your-reference" className="text-xs text-gray-500">Your reference</Label>
                        <Input id="your-reference" value={yourReference} onChange={e => setYourReference(e.target.value)} className="bg-white" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="recipient-reference" className="text-xs text-gray-500">Recipient's reference</Label>
                        <Input id="recipient-reference" value={recipientReference} onChange={e => setRecipientReference(e.target.value)} className="bg-white" />
                    </div>
                </div>
                
                 <div className="space-y-2">
                    <h2 className="font-semibold text-gray-700">Notifications (0/1)</h2>
                    <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                       <PlusCircle className="mr-2 h-5 w-5" />
                       Add a notification
                    </Button>
                </div>

                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700">When will it be paid?</h2>
                    <div className="space-y-2">
                        <Label htmlFor="transfer-date" className="text-xs text-gray-500">Payment date</Label>
                        <div className="relative">
                            <Input id="transfer-date" value={format(new Date(), 'EEEE, dd MMMM yyyy')} readOnly className="bg-white pr-10 border-primary" />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="transfer-repeat" className="text-xs text-gray-500">Payment repeat</Label>
                       <div className="relative">
                         <Input id="transfer-repeat" value="Never" readOnly className="bg-white pr-10 border-primary" />
                         <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                       </div>
                    </div>
                </div>
            </main>
             <footer className="p-4 bg-white border-t sticky bottom-0">
                <Button onClick={handleNext} className="w-full font-bold" disabled={!fromAccount || parseFloat(amount) <= 0}>
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

export default function AmountPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AmountPageContent />
        </Suspense>
    );
}
