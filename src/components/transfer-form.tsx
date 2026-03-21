'use client';

import { useState } from 'react';
import { ArrowLeft, CalendarIcon, ChevronRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Account } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/data';
import { useUser } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { createInternalTransferAction } from '@/app/lib/actions';

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

export function TransferForm({ allAccounts }: { allAccounts: Account[] }) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [amount, setAmount] = useState('0.00');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Safely set initial state for from and to accounts
  const initialFromAccount = allAccounts.length > 1 ? allAccounts.find(a => a.type !== 'Credit')?.id || allAccounts[0].id : (allAccounts.length > 0 ? allAccounts[0].id : null);
  const initialToAccount = allAccounts.length > 0 ? allAccounts[0].id : null;

  const [fromAccount, setFromAccount] = useState<string | null>(initialFromAccount);
  const [toAccount, setToAccount] = useState<string | null>(initialToAccount);


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
  }

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !user || parseFloat(amount) <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Transfer',
            description: 'Please select accounts and enter a valid amount.'
        });
        return;
    }

    if (fromAccount === toAccount) {
      toast({
          variant: 'destructive',
          title: 'Invalid Transfer',
          description: 'Cannot transfer money to the same account.'
      });
      return;
    }

    setIsProcessing(true);

    const result = await createInternalTransferAction({
        fromAccountId: fromAccount,
        toAccountId: toAccount,
        amount: amount,
        userId: user.uid,
        reference: reference
    });

    setIsProcessing(false);

    if (result.success) {
        toast({
            title: 'Transfer Successful',
            description: `${formatCurrency(parseFloat(amount))} has been transferred.`,
        });
        router.push('/dashboard');
    } else {
        toast({
            variant: 'destructive',
            title: 'Transfer Failed',
            description: result.message
        });
    }
}

  return (
    <div className="flex flex-col h-screen">
      <header className="brand-header text-primary-foreground p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Transfer</h1>
      </header>

      <div className="brand-header text-primary-foreground p-4 space-y-2">
        <label className="text-sm">Amount</label>
        <div className="flex items-end">
            <span className="text-2xl font-light mr-1">R</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              className="w-full bg-transparent text-4xl font-light border-b border-yellow-400 focus:outline-none focus:border-b-2"
              placeholder="0.00"
            />
        </div>
        <p className="text-xs text-center text-primary-foreground/80">R105 500.00 daily transfer limit remaining</p>
      </div>

      <main className="flex-1 bg-gray-50 p-4 space-y-6 overflow-y-auto">
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">From which account?</h2>
          <AccountSelector
            accounts={allAccounts.filter(a => a.type !== 'Credit')}
            selectedAccount={fromAccount}
            onSelectAccount={setFromAccount}
          />
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 mb-2">To which account?</h2>
          <AccountSelector
            accounts={allAccounts}
            selectedAccount={toAccount}
            onSelectAccount={setToAccount}
          />
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700">What is the transfer for?</h2>
          <Label htmlFor="reference" className="text-xs text-gray-500">Your reference (optional)</Label>
          <Input id="reference" placeholder="" className="bg-white" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>

        <div className="space-y-2">
           <h2 className="font-semibold text-gray-700">When will it be transferred?</h2>
           <Label htmlFor="transfer-date" className="text-xs text-gray-500">Transfer date</Label>
           <div className="relative">
             <Input id="transfer-date" value={`Today (${format(new Date(), 'dd MMMM yyyy')})`} readOnly className="bg-white pr-10" />
             <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
           </div>
        </div>

        <div className="space-y-2">
           <Label htmlFor="transfer-repeat" className="text-xs text-gray-500">Transfer repeat</Label>
           <div className="relative">
             <Input id="transfer-repeat" value="Never" disabled className="bg-gray-100 pr-10" />
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           </div>
           <p className="text-xs text-gray-400">A transfer for today's date can't be repeated.</p>
        </div>
      </main>

      <footer className="p-4 bg-white border-t">
        <Button className="w-full bg-primary hover:bg-primary/90 font-bold" onClick={handleTransfer} disabled={isProcessing}>
          {isProcessing ? <LoaderCircle className="animate-spin" /> : 'Transfer'}
        </Button>
      </footer>
    </div>
  );
}
