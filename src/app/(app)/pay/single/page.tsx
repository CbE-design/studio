
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Landmark, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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

export default function SinglePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState<string>('');
  const [amount, setAmount] = useState('1.00');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [yourReference, setYourReference] = useState('');
  const [recipientReference, setRecipientReference] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [paymentType, setPaymentType] = useState('Standard EFT');
  
  useEffect(() => {
    async function fetchAccounts() {
        const querySnapshot = await getDocs(collection(db, "accounts"));
        const fetchedAccounts = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            type: data.type,
            accountNumber: data.accountNumber,
            balance: data.balance,
            currency: data.currency,
          };
        });
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
            setFromAccount(fetchedAccounts[0].id);
        }
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    const selectedBank = searchParams.get('bank');
    if (selectedBank) {
      setBankName(decodeURIComponent(selectedBank));
    }
    const selectedPaymentType = searchParams.get('paymentType');
    if (selectedPaymentType) {
      setPaymentType(decodeURIComponent(selectedPaymentType));
    }
  }, [searchParams]);

  const handleNext = () => {
    const selectedAccount = accounts.find(acc => acc.id === fromAccount);
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
      <header className="bg-primary text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Whom would you like to pay?</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
             <div>
                <Label htmlFor="from-account" className="text-xs text-gray-500 font-semibold">From account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger id="from-account" className="mt-1">
                        <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="amount" className="text-xs text-gray-500 font-semibold">Amount</Label>
                <Input id="amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="1.00" className="mt-1" />
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <div>
                <Label htmlFor="recipient-name" className="text-xs text-gray-500 font-semibold">A new recipient</Label>
                <Input id="recipient-name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name and surname" className="mt-1" />
            </div>

            <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <span className="flex-1 text-gray-700">Select from saved recipients</span>
            </div>
             <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Landmark className="h-5 w-5 mr-3 text-primary" />
                <span className="flex-1 text-gray-700">Select from bank-approved recipients</span>
            </div>
             <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
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

        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <h2 className="font-semibold text-gray-800">To which account?</h2>
            <div className="space-y-2">
                <Label htmlFor="bank-name" className="text-xs text-gray-500 font-semibold">Bank name</Label>
                <div className="relative" onClick={() => router.push('/pay/single/select-bank')}>
                    <Input 
                      id="bank-name" 
                      value={bankName} 
                      readOnly 
                      placeholder="Select bank" 
                      className="pr-10 cursor-pointer"
                    />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="account-number" className="text-xs text-gray-500 font-semibold">Account number</Label>
                <Input id="account-number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="" />
            </div>

             <div className="space-y-2">
                <Label htmlFor="your-reference" className="text-xs text-gray-500 font-semibold">Your reference (optional)</Label>
                <Input id="your-reference" value={yourReference} onChange={e => setYourReference(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recipient-reference" className="text-xs text-gray-500 font-semibold">Recipient's reference (optional)</Label>
                <Input id="recipient-reference" value={recipientReference} onChange={e => setRecipientReference(e.target.value)} />
            </div>

            <h2 className="font-semibold text-gray-800 pt-2">Payment type?</h2>
            <div className="space-y-2">
                 <Label htmlFor="payment-method" className="text-xs text-gray-500 font-semibold">Payment method</Label>
                <div className="relative" onClick={() => router.push(`/pay/single/select-payment-type?bank=${encodeURIComponent(bankName)}`)}>
                    <Input id="payment-method" value={paymentType} readOnly className="pr-10 border-primary cursor-pointer" />
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
            className={cn("w-full font-bold", isFormValid ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300 hover:bg-gray-400 text-gray-600')}
            disabled={!isFormValid}
            onClick={handleNext}
        >
          Next
        </Button>
      </footer>
    </div>
  );
}
