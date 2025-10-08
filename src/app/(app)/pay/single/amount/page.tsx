
'use client';

import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarIcon, ChevronRight, ChevronUp, ChevronDown, LoaderCircle, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account, TransactionType } from '@/app/lib/definitions';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { calculateFee } from '@/app/lib/fees';

const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}: {
  accounts: Account[];
  selectedAccount: string | null;
  onSelectAccount: (accountId: string) => void;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ up: false, down: false });

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setCanScroll({
        up: scrollTop > 0,
        down: scrollTop < scrollHeight - clientHeight,
      });
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScrollability);
    return () => container?.removeEventListener('scroll', checkScrollability);
  }, [accounts]);
  
  const scroll = (direction: 'up' | 'down') => {
    scrollContainerRef.current?.scrollBy({
      top: direction === 'up' ? -160 : 160, // Adjust scroll amount as needed
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex justify-center items-center gap-2">
       <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('up')}
        disabled={!canScroll.up}
        className="text-primary disabled:text-gray-300"
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
      <div
        ref={scrollContainerRef}
        className="flex flex-col space-y-4 h-40 overflow-y-auto no-scrollbar" // h-40 allows viewing one card at a time with some peek
      >
        {accounts.map((account) => (
          <Card
            key={account.id}
            className={cn(
              'min-w-[200px] w-[200px] border-2 rounded-lg transition-all cursor-pointer shadow-sm',
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
                  {account.name}
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
            </CardContent>
          </Card>
        ))}
      </div>
       <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('down')}
        disabled={!canScroll.down}
        className="text-primary disabled:text-gray-300"
      >
        <ChevronDown className="h-6 w-6" />
      </Button>
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

    const [amount, setAmount] = useState('');
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
    
    const { estimatedFee, transactionType } = useMemo(() => {
        const numericAmount = parseFloat(amount) || 0;
        const selectedAccountType = allAccounts?.find(acc => acc.id === fromAccount)?.type || 'Cheque';
        let txType: TransactionType = 'EFT_STANDARD';
        if (paymentDetails.paymentType === 'Instant Pay') {
            txType = 'EFT_IMMEDIATE';
        }
        
        const fee = calculateFee(numericAmount, txType, selectedAccountType);
        return { estimatedFee: fee, transactionType: txType };
    }, [amount, fromAccount, allAccounts, paymentDetails.paymentType]);

    const totalDeduction = (parseFloat(amount) || 0) + estimatedFee;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        const decimalCount = (value.match(/\./g) || []).length;
        if (decimalCount > 1) return;
        setAmount(value);
    };

    const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const numberValue = parseFloat(e.target.value);
        if (!isNaN(numberValue) && e.target.value) {
            setAmount(numberValue.toFixed(2));
        } else {
            setAmount('');
        }
    };
    
    const handleNext = () => {
        const params = new URLSearchParams();
        Object.entries(paymentDetails).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const finalAmount = parseFloat(amount) > 0 ? amount : '0.00';
        params.set('amount', finalAmount);
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
            <header className="gradient-background text-primary-foreground p-4 flex flex-col justify-between sticky top-0 z-10 h-[220px]">
                <div className="w-full flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold">Pay {paymentDetails.recipientName}</h1>
                        <p className="text-sm opacity-80">{paymentDetails.bankName}</p>
                        <p className="text-sm opacity-80">{paymentDetails.accountNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="-mr-2" onClick={() => router.push('/dashboard')}>
                        <X />
                    </Button>
                </div>
                <div className="w-full flex justify-center items-end text-center">
                    <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    className="w-full bg-transparent text-5xl font-light focus:outline-none text-center"
                    placeholder="R 0.00"
                    />
                </div>
                 <div className="h-10" />
            </header>
            <div className="w-full h-1 bg-yellow-400"></div>
            <div className="text-xs text-center text-gray-500 py-1 bg-gray-200">
                {estimatedFee > 0 ? (
                    <span>
                        Estimated Fee: <span className="font-semibold">{formatCurrency(estimatedFee)}</span>. 
                        Total deduction: <span className="font-semibold">{formatCurrency(totalDeduction)}</span>.
                    </span>
                ) : (
                    <span>
                        R999 999.90 daily payment limit remaining
                    </span>
                )}
            </div>
            
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6">
                <div className="space-y-2">
                    <h2 className="font-semibold text-gray-700 mb-2 text-center">From which account?</h2>
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
                <Button onClick={handleNext} className="w-full font-bold" disabled={!fromAccount || !amount || parseFloat(amount) <= 0}>
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
