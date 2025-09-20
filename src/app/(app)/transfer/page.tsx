
'use client';

import { useState } from 'react';
import { ArrowLeft, CalendarIcon, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { accounts as allAccounts } from '@/app/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}: {
  accounts: typeof allAccounts;
  selectedAccount: string | null;
  onSelectAccount: (accountId: string) => void;
}) => {
  return (
    <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4">
      {accounts.map((account, index) => (
        <Card
          key={account.id}
          className={cn(
            'min-w-[150px] w-[150px] border-2 rounded-lg transition-all',
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
              {`R${account.balance.toFixed(2)}`}
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

export default function TransferPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('R0.00');
  const [fromAccount, setFromAccount] = useState<string | null>(allAccounts[1].id);
  const [toAccount, setToAccount] = useState<string | null>(allAccounts[0].id);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const numberValue = parseFloat(value);
    if (!isNaN(numberValue)) {
      setAmount(`R${numberValue.toFixed(2)}`);
    } else {
      setAmount('R0.00');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Transfer</h1>
      </header>

      <div className="bg-primary text-primary-foreground p-4 space-y-2">
        <label className="text-sm">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          className="w-full bg-transparent text-4xl font-light border-b border-yellow-400 focus:outline-none focus:border-b-2"
        />
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
          <Input id="reference" placeholder="" className="bg-white" />
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
        <Button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-600 font-bold">
          Next
        </Button>
      </footer>
    </div>
  );
}
