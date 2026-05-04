'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, LoaderCircle, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Transaction } from '@/app/lib/definitions';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const SinglePaymentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.906 10.7487C18.1517 10.7487 20.0003 8.90011 20.0003 6.6544C20.0003 4.40869 18.1517 2.56006 15.906 2.56006C13.6603 2.56006 11.8117 4.40869 11.8117 6.6544C11.8117 8.90011 13.6603 10.7487 15.906 10.7487Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.9961 5.41895H16.0305C16.4808 5.41895 16.8471 5.78523 16.8471 6.23554V7.26993" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.0305 7.26953H14.9961" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.0121 16.9202V28.9189C23.0121 29.213 22.775 29.4501 22.4809 29.4501H9.51953C9.22543 29.4501 8.98828 29.213 8.98828 28.9189V16.9202" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.7981 18.8169L24.0899 12.8711C23.858 11.9566 22.955 11.3652 21.9963 11.3652H10.0041C9.04543 11.3652 8.14234 11.9566 7.91044 12.8711L6.20215 18.8169" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaymentItem = ({ tx }: { tx: Transaction & { accountId: string } }) => {
    const isPending = tx.status === 'PENDING_APPROVAL';
    const isRejected = tx.status === 'REJECTED';

    return (
        <Link href={`/account/${tx.accountId}/transaction/${tx.id}`}>
            <div className="flex items-center justify-between py-4 px-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5 tracking-wider">{format(normalizeDate(tx.date), 'dd MMM yyyy')}</p>
                    <p className="text-sm font-semibold text-gray-800 uppercase flex items-center gap-2">
                        {tx.recipientName || tx.description}
                        {isPending && <Clock className="h-3 w-3 text-amber-500 animate-pulse" />}
                        {isRejected && <XCircle className="h-3 w-3 text-red-500" />}
                    </p>
                    {isPending && <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tight">Mandate: Awaiting Authorisation</p>}
                    {isRejected && <p className="text-[9px] text-red-600 font-bold uppercase tracking-tight">Instruction Rejected</p>}
                </div>
                <div className="text-right">
                    <p className={cn("text-sm font-bold", isRejected ? "text-gray-300 line-through" : "text-gray-900")}>
                        -{formatCurrency(tx.amount)}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-300 inline-block ml-2" />
                </div>
            </div>
        </Link>
    );
};

export default function PayPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [transactions, setTransactions] = useState<(Transaction & { accountId: string })[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);
  
  const { data: accounts } = useCollection(accountsQuery);

  useEffect(() => {
    if (!accounts || isUserLoading) return;

    const fetchAllTransactions = async () => {
        setIsTransactionsLoading(true);
        if (!user?.uid) {
            setIsTransactionsLoading(false);
            return;
        }
        let allTransactions: (Transaction & { accountId: string })[] = [];

        try {
          for (const account of accounts) {
              const transactionsCollectionRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
              const transactionsSnapshot = await getDocs(query(transactionsCollectionRef));
              transactionsSnapshot.forEach(doc => {
                  const data = doc.data() as Transaction;
                  if (data.type === 'debit' && data.transactionType !== 'BANK_FEE') {
                       allTransactions.push({ 
                           id: doc.id, 
                           ...data,
                           accountId: account.id,
                       } as Transaction & { accountId: string });
                  }
              });
          }
          
          allTransactions.sort((a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime());
          setTransactions(allTransactions);
        } catch (e) {
          console.error("Failed to fetch instructions:", e);
        } finally {
          setIsTransactionsLoading(false);
        }
    };

    fetchAllTransactions();
  }, [accounts, firestore, user?.uid, isUserLoading]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const lower = searchTerm.toLowerCase();
    return transactions.filter(tx => 
      (tx.recipientName?.toLowerCase().includes(lower)) || 
      (tx.description?.toLowerCase().includes(lower))
    );
  }, [transactions, searchTerm]);

  const { pendingPayments, clearedPayments } = useMemo(() => {
    const pending = filteredTransactions.filter(tx => tx.status === 'PENDING_APPROVAL');
    const cleared = filteredTransactions.filter(tx => tx.status === 'SUCCESS' || !tx.status || tx.status === 'REJECTED');
    return { pendingPayments: pending, clearedPayments: cleared };
  }, [filteredTransactions]);
  
  const isLoading = isUserLoading || isTransactionsLoading;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="brand-header flex-shrink-0 shadow-sm">
        <header className="p-4 pt-6">
          <Button variant="ghost" size="icon" className="-ml-2 mb-2 text-white hover:bg-white/10" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-white px-2 pb-6">What would you like to do?</h1>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b mb-6">
            <Link href="/pay/single">
              <div className="flex items-center p-5 px-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="mr-5"><SinglePaymentIcon /></div>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-800 text-base">Single payment</h2>
                  <p className="text-gray-500 text-xs leading-relaxed">Make a once-off payment or pay a saved recipient.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Link>
        </div>

        <div className="px-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Tracking instructions</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search instructions" 
                className="pl-9 h-11 bg-white border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-12 border-b border-gray-200 rounded-none">
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-[#007a33] rounded-none data-[state=active]:text-[#007a33] font-bold text-gray-400 text-xs uppercase tracking-widest h-full"
                >
                    Awaiting ({pendingPayments.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="cleared" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-[#007a33] rounded-none data-[state=active]:text-[#007a33] font-bold text-gray-400 text-xs uppercase tracking-widest h-full"
                >
                    Processed
                </TabsTrigger>
              </TabsList>
              
              <div className="bg-white rounded-b-xl border border-t-0 shadow-sm overflow-hidden min-h-[160px]">
                <TabsContent value="pending" className="m-0 focus-visible:ring-0">
                   {isLoading ? (
                      <div className="p-12 text-center"><LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                   ) : pendingPayments.length > 0 ? (
                      pendingPayments.map(tx => <PaymentItem key={tx.id} tx={tx} />)
                   ) : (
                      <div className="text-center py-12 px-6">
                          <Clock className="h-10 w-10 text-gray-100 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium text-sm">No instructions currently awaiting trustee signature.</p>
                      </div>
                   )}
                </TabsContent>
                <TabsContent value="cleared" className="m-0 focus-visible:ring-0">
                  {isLoading ? (
                      <div className="p-12 text-center"><LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                  ) : clearedPayments.length > 0 ? (
                      clearedPayments.map(tx => <PaymentItem key={tx.id} tx={tx} />)
                  ) : (
                    <div className="text-center py-12 px-6">
                      <CheckCircle2 className="h-10 w-10 text-gray-100 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium text-sm">No processed payments to display.</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Nedbank Trust clearing system active</p>
          </div>
      </main>
    </div>
  );
}
