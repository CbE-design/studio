
'use client';

import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarIcon, ChevronRight, ChevronUp, ChevronDown, LoaderCircle, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, parseISO } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account, Transaction, TransactionType } from '@/app/lib/definitions';
import { collection, query, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { calculateFee } from '@/app/lib/fees';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}: {
  accounts: Account[];
  selectedAccount: string | null;
  onSelectAccount: (accountId: string) => void;
}) => {
    const [api, setApi] = useState<CarouselApi>()
 
    useEffect(() => {
        if (!api) {
            return
        }
        
        const selectedIndex = accounts.findIndex(acc => acc.id === selectedAccount);
        if (selectedIndex !== -1) {
            api.scrollTo(selectedIndex, true);
        }

        api.on("select", () => {
            const newSelectedIndex = api.selectedScrollSnap();
            if (accounts[newSelectedIndex]) {
                onSelectAccount(accounts[newSelectedIndex].id);
            }
        })
    }, [api, accounts, selectedAccount, onSelectAccount])


  return (
    <Carousel setApi={setApi}
      opts={{
        align: "center",
        loop: false,
      }}
      className="w-full max-w-sm mx-auto"
    >
      <CarouselContent className="-ml-2">
        {accounts.map((account, index) => (
          <CarouselItem key={index} className="pl-2 basis-2/3 md:basis-1/2">
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
                        'font-semibold text-sm uppercase',
                        selectedAccount === account.id
                        ? 'text-primary'
                        : 'text-gray-600'
                    )}
                    >
                    {account.name}
                    </p>
                    <p className="text-xs text-gray-400">{account.accountNumber}</p>
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
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
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
    const [dailyLimitRemaining, setDailyLimitRemaining] = useState<number | null>(null);

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
    
    useEffect(() => {
        const yourRef = searchParams.get('yourReference');
        if (yourRef) setYourReference(yourRef);
        const recipientRef = searchParams.get('recipientReference');
        if (recipientRef) setRecipientReference(recipientRef);
    }, [searchParams]);

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
    
    useEffect(() => {
        if (!allAccounts || isUserLoading) return;

        const calculateDailyLimit = async () => {
            if (!user?.uid) return;
            const TOTAL_DAILY_LIMIT = 5000000.00;
            let totalSpentToday = 0;

            for (const account of allAccounts) {
                const transactionsCollectionRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
                const transactionsSnapshot = await getDocs(query(transactionsCollectionRef));
                transactionsSnapshot.forEach(doc => {
                    const tx = doc.data() as Transaction;
                    if (tx.date && tx.type === 'debit' && tx.transactionType !== 'BANK_FEE' && isToday(parseISO(tx.date))) {
                        totalSpentToday += tx.amount;
                    }
                });
            }
            setDailyLimitRemaining(TOTAL_DAILY_LIMIT - totalSpentToday);
        };

        calculateDailyLimit();

    }, [allAccounts, firestore, user?.uid, isUserLoading]);
    
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

    const isLoading = isUserLoading || isAccountsLoading || !allAccounts || dailyLimitRemaining === null;

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    const chequeAccounts = allAccounts.filter(a => a.type === 'Cheque');

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex flex-col justify-between sticky top-0 z-10 min-h-[240px]">
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
                <div className="w-full flex-grow flex flex-col justify-center items-center text-center">
                     <label htmlFor="amount" className="text-sm opacity-80 self-start w-full px-4">Amount</label>
                    <div className="flex items-center w-full px-4">
                        <span className="text-3xl font-light text-white opacity-80">R</span>
                        <input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={handleAmountChange}
                            onBlur={handleAmountBlur}
                            className="w-full bg-transparent text-white text-4xl font-light focus:outline-none border-b-2 border-yellow-400 placeholder-white/80"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                 <div className="text-xs text-center text-primary-foreground/80 py-1">
                    {dailyLimitRemaining !== null ? (
                        <span>
                            {formatCurrency(dailyLimitRemaining)} daily payment limit remaining
                        </span>
                    ) : (
                        <span>
                            Calculating payment limit...
                        </span>
                    )}
                 </div>
            </header>
            
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="font-semibold text-gray-700 mb-2">From which account?</h2>
                     <AccountSelector
                        accounts={chequeAccounts}
                        selectedAccount={fromAccount}
                        onSelectAccount={setFromAccount}
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700">What is the payment for?</h2>
                    <div className="space-y-2">
                        <Label htmlFor="your-reference" className="text-xs text-gray-500">Your reference</Label>
                        <Input id="your-reference" value={yourReference} onChange={e => setYourReference(e.target.value)} className="bg-white border-primary" />
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
                            <Input id="transfer-date" value={format(new Date(), 'EEEE, dd MMMM yyyy')} readOnly className="bg-white pr-10" />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="transfer-repeat" className="text-xs text-gray-500">Payment repeat</Label>
                       <div className="relative">
                         <Input id="transfer-repeat" value="Never" readOnly className="bg-white pr-10" />
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
