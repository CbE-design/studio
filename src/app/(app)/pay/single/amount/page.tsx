'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarIcon, ChevronRight, LoaderCircle, PlusCircle, X, Trash2, Info } from 'lucide-react';
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
import { calculateFee } from '@/app/lib/fees';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

const AccountCard = ({
  account,
  isSelected,
  onClick,
}: {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
    <div className={cn(
      'rounded-lg border-2 overflow-hidden w-44 transition-all',
      isSelected ? 'border-primary' : 'border-gray-200'
    )}>
      <div className="bg-white p-3 text-center">
        <p className={cn(
          'font-bold text-sm uppercase',
          isSelected ? 'text-primary' : 'text-gray-600'
        )}>
          {account.name}
        </p>
        <p className="text-xs text-gray-400">{account.accountNumber}</p>
      </div>
      <div className={cn(
        'p-3 text-center text-white font-bold text-sm',
        isSelected ? 'bg-primary' : 'bg-gray-300'
      )}>
        <p className="text-lg font-bold">{formatCurrency(account.balance, account.currency)}</p>
        <p className="text-xs font-normal opacity-90">Available balance</p>
      </div>
    </div>
    {isSelected && (
      <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-primary" />
    )}
  </div>
);

const LoadingSkeleton = () => (
    <div className="flex flex-col h-screen">
        <div className="gradient-background p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-6 bg-white/20" />
                <Skeleton className="h-8 w-32 bg-white/20" />
                <Skeleton className="h-6 w-6 bg-white/20" />
            </div>
        </div>
        <div className="p-4 space-y-8">
            <Skeleton className="h-16 w-full" />
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
    
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
    const [notificationTypeDialog, setNotificationTypeDialog] = useState<'email' | 'sms' | null>(null);
    const [notificationValue, setNotificationValue] = useState('');
    const [savedNotification, setSavedNotification] = useState<{ type: 'email' | 'sms'; value: string } | null>(null);

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
        saveRecipient: searchParams.get('saveRecipient'),
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
    
    const handleAddNotification = () => {
        if (notificationValue && notificationTypeDialog) {
            setSavedNotification({ type: notificationTypeDialog, value: notificationValue });
            setNotificationTypeDialog(null);
            setNotificationValue('');
        }
    };

    const handleRemoveNotification = () => {
        setSavedNotification(null);
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
        if (savedNotification) {
            params.set('notificationType', savedNotification.type);
            params.set('notificationValue', savedNotification.value);
        }
        router.push(`/pay/single/review?${params.toString()}`);
    }

    const isLoading = isUserLoading || isAccountsLoading || !allAccounts || dailyLimitRemaining === null;

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    const chequeAccounts = allAccounts.filter(a => a.type === 'Cheque');
    const limitPercentUsed = dailyLimitRemaining !== null ? Math.max(0, Math.min(100, (dailyLimitRemaining / 5000000) * 100)) : 100;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground px-4 pt-3 pb-4 sticky top-0 z-10">
                <div className="w-full flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold">Pay {paymentDetails.recipientName}</h1>
                        <p className="text-xs opacity-80">{paymentDetails.bankName}</p>
                        <p className="text-xs opacity-80">{paymentDetails.accountNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="-mr-2" onClick={() => router.push('/dashboard')}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="gradient-background px-4 py-4 border-b border-white/20">
                <Label className="text-xs text-white/80 font-semibold">Amount</Label>
                <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-light text-white">R</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        onBlur={handleAmountBlur}
                        className="w-full bg-transparent text-white text-3xl font-light focus:outline-none placeholder-white/50 ml-0.5"
                        placeholder="0.00"
                    />
                </div>
                <div className="mt-3 w-full h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${limitPercentUsed}%` }}
                    />
                </div>
                <p className="text-xs text-white/80 text-center mt-2">
                    {formatCurrency(dailyLimitRemaining ?? 0)} daily payment limit remaining
                </p>
            </div>
            
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 pb-2">
                    <h2 className="font-semibold text-sm text-gray-800 mb-4">From which account?</h2>
                    <div className="flex justify-center">
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {chequeAccounts.map(account => (
                                <AccountCard
                                    key={account.id}
                                    account={account}
                                    isSelected={fromAccount === account.id}
                                    onClick={() => setFromAccount(account.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <h2 className="font-semibold text-sm text-gray-800">What is the payment for?</h2>
                    <div className="space-y-1">
                        <Label htmlFor="your-reference" className="text-xs text-gray-500">Your reference</Label>
                        <Input id="your-reference" value={yourReference} onChange={e => setYourReference(e.target.value)} className="bg-white" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="recipient-reference" className="text-xs text-gray-500">Recipient&apos;s reference</Label>
                        <Input id="recipient-reference" value={recipientReference} onChange={e => setRecipientReference(e.target.value)} className="bg-white" />
                    </div>
                </div>
                
                <div className="px-4 pb-4 space-y-2">
                    <h2 className="font-semibold text-sm text-gray-800">Notifications ({savedNotification ? '1' : '0'}/1)</h2>
                    {savedNotification ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">{savedNotification.type === 'sms' ? 'Enter cellphone number' : 'Enter email address'}</p>
                                <p className="text-gray-800">{savedNotification.value}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleRemoveNotification}>
                                <Trash2 className="h-5 w-5 text-primary" />
                            </Button>
                        </div>
                    ) : (
                        <button className="flex items-center text-primary font-semibold text-sm" onClick={() => setNotificationDialogOpen(true)}>
                           <PlusCircle className="mr-2 h-5 w-5" />
                           Add a notification
                        </button>
                    )}
                </div>

                <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
                    <DialogContent className="sm:max-w-md p-0">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Notifications</DialogTitle>
                        </DialogHeader>
                        <Alert className="bg-yellow-50 border-none rounded-none text-gray-800 p-5 mt-4 flex items-start gap-3">
                            <Info className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                            <AlertDescription className="text-xs text-gray-800 leading-relaxed">
                                A service fee may be charged based on your banking account package. Please refer to our <span className="text-primary underline cursor-pointer font-bold">latest pricing guide</span>.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-0 p-6 pt-0">
                            <button
                                className="w-full py-4 text-left font-semibold border-b hover:bg-gray-50"
                                onClick={() => {
                                    setNotificationDialogOpen(false);
                                    setNotificationTypeDialog('email');
                                }}
                            >
                                EMAIL
                            </button>
                            <button
                                className="w-full py-4 text-left font-semibold hover:bg-gray-50"
                                onClick={() => {
                                    setNotificationDialogOpen(false);
                                    setNotificationTypeDialog('sms');
                                }}
                            >
                                SMS
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={notificationTypeDialog !== null} onOpenChange={(open) => { if (!open) { setNotificationTypeDialog(null); setNotificationValue(''); }}}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{notificationTypeDialog === 'sms' ? 'Enter cellphone number' : 'Enter email address'}</DialogTitle>
                            <DialogDescription>
                                {notificationTypeDialog === 'sms' 
                                    ? 'Enter the phone number to receive payment notification SMS.'
                                    : 'Enter the email address to receive payment notification.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                value={notificationValue}
                                onChange={(e) => setNotificationValue(e.target.value)}
                                placeholder={notificationTypeDialog === 'sms' ? '+27123456789' : 'email@example.com'}
                                type={notificationTypeDialog === 'sms' ? 'tel' : 'email'}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAddNotification} disabled={!notificationValue}>
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="px-4 pb-6 space-y-3">
                    <h2 className="font-semibold text-sm text-gray-800">When will it be paid?</h2>
                    <div className="space-y-1">
                        <Label htmlFor="transfer-date" className="text-xs text-gray-500">Payment date</Label>
                        <div className="relative">
                            <Input id="transfer-date" value={format(new Date(), 'EEEE, dd MMMM yyyy')} readOnly className="bg-white pr-10 border-primary" />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-1">
                       <Label htmlFor="transfer-repeat" className="text-xs text-gray-500">Payment repeat</Label>
                       <div className="relative">
                         <Input id="transfer-repeat" value="Never" readOnly className="bg-white pr-10 border-primary" />
                         <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                       </div>
                    </div>
                </div>
            </main>
            <footer className="p-4 bg-white border-t sticky bottom-0 z-20">
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
