
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const tabs = [
    { name: 'New recipient', icon: UserPlus },
    { name: 'Saved recipient', icon: Users }
];

export default function SinglePaymentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('New recipient');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRef, setRecipientRef] = useState('');
  const [myRef, setMyRef] = useState('');
  const [amount, setAmount] = useState('');
  
  const isFormValid = useMemo(() => {
    return bankName && accountNumber && recipientName && recipientRef && myRef && parseFloat(amount) > 0;
  }, [bankName, accountNumber, recipientName, recipientRef, myRef, amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const formattedAmount = useMemo(() => {
    if (!amount) return 'R 0.00';
    const num = parseFloat(amount);
    return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [amount]);


  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white text-gray-800 p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Pay</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={cn(
                'w-1/2 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                activeTab === tab.name
                  ? 'bg-white text-gray-800 shadow'
                  : 'bg-transparent text-gray-500'
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </div>
        
        {activeTab === 'New recipient' && (
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="bank-name" className="text-gray-500 text-xs">Bank name</Label>
                    <Input id="bank-name" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Select or type bank name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number" className="text-gray-500 text-xs">Account number</Label>
                    <Input id="account-number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter account number" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipient-name" className="text-gray-500 text-xs">Recipient name</Label>
                    <Input id="recipient-name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Who are you paying?" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recipient-ref" className="text-gray-500 text-xs">Their reference</Label>
                    <Input id="recipient-ref" value={recipientRef} onChange={e => setRecipientRef(e.target.value)} placeholder="For the recipient's statement" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="my-ref" className="text-gray-500 text-xs">My reference</Label>
                    <Input id="my-ref" value={myRef} onChange={e => setMyRef(e.target.value)} placeholder="For your statement" />
                </div>
            </div>
        )}
        
        <div className="space-y-2 pt-4">
             <label className="text-sm font-semibold text-gray-700">Amount</label>
             <div className="relative">
                <input
                    type="text"
                    value={formattedAmount}
                    readOnly
                    className="w-full bg-transparent text-4xl font-light border-b-2 border-primary focus:outline-none pb-1"
                />
                 <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className="absolute inset-0 opacity-0 w-full h-full"
                />
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border rounded-lg">
                <div>
                    <p className="font-semibold">Standard EFT</p>
                    <p className="text-sm text-gray-500">Immediate or delayed payment</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
        </div>

      </main>
      <footer className="p-4 bg-white border-t">
        <Button 
            className={cn("w-full font-bold", isFormValid ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300 hover:bg-gray-400 text-gray-600')}
            disabled={!isFormValid}
        >
          Next
        </Button>
      </footer>
    </div>
  );
}
