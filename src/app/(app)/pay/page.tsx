'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Transaction, Beneficiary } from '@/app/lib/definitions';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { formatCurrency, normalizeDate } from '@/app/lib/data';

const SinglePaymentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.906 10.7487C18.1517 10.7487 20.0003 8.90011 20.0003 6.6544C20.0003 4.40869 18.1517 2.56006 15.906 2.56006C13.6603 2.56006 11.8117 4.40869 11.8117 6.6544C11.8117 8.90011 13.6603 10.7487 15.906 10.7487Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.9961 5.41895H16.0305C16.4808 5.41895 16.8471 5.78523 16.8471 6.23554V7.26993" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.0305 7.26953H14.9961" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.0121 16.9202V28.9189C23.0121 29.213 22.775 29.4501 22.4809 29.4501H9.51953C9.22543 29.4501 8.98828 29.213 8.98828 28.9189V16.9202" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.7981 18.8169L24.0899 12.8711C23.858 11.9566 22.955 11.3652 21.9963 11.3652H10.0041C9.04543 11.3652 8.14234 11.9566 7.91044 12.8711L6.20215 18.8169" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendMoneyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.3332 5.33301H10.6665C9.20128 5.33301 7.99984 6.53445 7.99984 7.99967V23.9997C7.99984 25.4649 9.20128 26.6663 10.6665 26.6663H21.3332C22.7984 26.6663 23.9998 25.4649 23.9998 23.9997V7.99967C23.9998 6.53445 22.7984 5.33301 21.3332 5.33301Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 21.333V21.333" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.0039 12.0859H16.0383C16.4808 12.0859 16.8549 12.4522 16.8549 12.9025V13.9369" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.0383 13.9365H15.0039" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PayShapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="16" r="2" fill="#F06325"/>
    <circle cx="16" cy="16" r="2" fill="#F06325"/>
    <circle cx="24" cy="16" r="2" fill="#F06325"/>
    <circle cx="12" cy="22" r="2" fill="#F06325"/>
    <circle cx="20" cy="22" r="2" fill="#F06325"/>
    <circle cx="12" cy="10" r="2" fill="#F06325"/>
    <circle cx="20" cy="10" r="2" fill="#F06325"/>
  </svg>
);

const BillPaymentsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.6665 5.33301H9.33317C8.59945 5.33301 7.99984 5.93262 7.99984 6.66634V25.333C7.99984 26.0667 8.59945 26.6663 9.33317 26.6663H22.6665C23.4002 26.6663 23.9998 26.0667 23.9998 25.333V6.66634C23.9998 5.93262 23.4002 5.33301 22.6665 5.33301Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18.667H20" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22.667H16" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.9061 13.4153C19.1518 13.4153 20.1515 12.4156 20.1515 11.17C20.1515 9.92429 19.1518 8.92456 17.9061 8.92456C16.6604 8.92456 15.6606 9.92429 15.6606 11.17C15.6606 12.4156 16.6604 13.4153 17.9061 13.4153Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.0039 10.1855H18.0383C18.4886 10.1855 18.8549 10.5518 18.8549 11.0021V12.0365" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.0383 12.0361H17.0039" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GovernmentPaymentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.3335 26.667H26.6668" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 26.667V10.667" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 26.667V10.667" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 26.667V10.667" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 10.667L16 4.00033L28 10.667" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5714 16.4286C20.0238 16.4286 21.2857 17.6905 21.2857 19.1429C21.2857 20.5952 20.0238 21.8571 18.5714 21.8571C17.119 21.8571 15.8571 20.5952 15.8571 19.1429C15.8571 17.6905 17.119 16.4286 18.5714 16.4286Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.8574 18.2148H18.6432C18.9912 18.2148 19.2718 18.4954 19.2718 18.8434V19.6291" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6432 19.6289H17.8574" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InternationalPaymentsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="13.3333" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.6665 16H29.3332" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2.66699C18.8887 7.55588 20.4442 12.8892 20.4442 16.0003C20.4442 19.1114 18.8887 24.4448 16 29.3337C13.1111 24.4448 11.5556 19.1114 11.5556 16.0003C11.5556 12.8892 13.1111 7.55588 16 2.66699Z" stroke="#008248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const paymentOptions = [
  {
    icon: <SinglePaymentIcon />,
    title: 'Single payment',
    description: 'Make a once-off payment or pay a saved recipient.',
    href: '/pay/single',
  },
  {
    icon: <SendMoneyIcon />,
    title: 'Send money',
    description: 'Send money to anyone with a South African cellphone number.',
    href: '#',
  },
  {
    icon: <PayShapIcon />,
    title: 'PayShap',
    description: 'Make real-time payments and payment requests with PayShap.',
    href: '#',
  },
  {
    icon: <BillPaymentsIcon />,
    title: 'Bill payments',
    description: 'Add and manage your monthly bills. Earn great rewards.',
    href: '#',
  },
  {
    icon: <GovernmentPaymentIcon />,
    title: 'Government payment',
    description: 'Complete and view government payments.',
    href: '#',
  },
  {
    icon: <InternationalPaymentsIcon />,
    title: 'International payments',
    description: 'View, receive and make payments, or send money internationally.',
    href: '#',
  },
];

const PaymentItem = ({ tx }: { tx: Transaction & { accountId: string } }) => (
    <Link href={`/account/${tx.accountId}/transaction/${tx.id}`}>
        <div className="flex items-center justify-between py-4 px-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col">
                <p className="text-sm text-gray-400 mb-1">{format(normalizeDate(tx.date), 'dd MMM yyyy')}</p>
                <p className="text-base font-light text-gray-800 uppercase">{tx.recipientName || tx.description}</p>
            </div>
            <p className="text-base font-light text-gray-800">
                -{formatCurrency(tx.amount)}
            </p>
        </div>
    </Link>
);

export default function PayPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [transactions, setTransactions] = useState<(Transaction & { accountId: string })[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'beneficiaries'));
  }, [firestore, user?.uid]);

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);
  
  const { data: accounts } = useCollection(accountsQuery);
  const { data: beneficiaries, isLoading: isBeneficiariesLoading } = useCollection<Beneficiary>(beneficiariesQuery);

  useEffect(() => {
    if (!accounts || isUserLoading) return;

    const fetchAllTransactions = async () => {
        setIsTransactionsLoading(true);
        if (!user?.uid) {
            setIsTransactionsLoading(false);
            return;
        }
        let allTransactions: (Transaction & { accountId: string })[] = [];

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
        setIsTransactionsLoading(false);
    };

    fetchAllTransactions();
  }, [accounts, firestore, user?.uid, isUserLoading]);

  const { savedPayments, onceOffPayments } = useMemo(() => {
    if (!beneficiaries || !transactions) {
        return { savedPayments: [], onceOffPayments: [] };
    }
    const savedAccountNumbers = new Set(beneficiaries.map(b => b.accountNumber));
    const savedPayments = transactions.filter(tx => tx.accountNumber && savedAccountNumbers.has(tx.accountNumber));
    const onceOffPayments = transactions.filter(tx => !tx.accountNumber || !savedAccountNumbers.has(tx.accountNumber));
    return { savedPayments, onceOffPayments };
  }, [beneficiaries, transactions]);
  
  const isLoading = isUserLoading || isBeneficiariesLoading || isTransactionsLoading;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <header className="p-4 pt-6">
          <Button variant="ghost" size="icon" className="-ml-2 mb-2" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 px-2 pb-6">What would you like to do?</h1>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b">
            {paymentOptions.map((option, index) => (
              <Link href={option.href || '#'} key={option.title}>
                <div
                  className={`flex items-center p-4 px-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index < paymentOptions.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="mr-4">{option.icon}</div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-700 text-base">{option.title}</h2>
                    <p className="text-muted-foreground text-sm">{option.description}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              </Link>
            ))}
        </div>

        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your recent payments</h2>
            <Tabs defaultValue="recipient" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
                <TabsTrigger value="recipient" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:text-primary font-semibold">Recipient payments</TabsTrigger>
                <TabsTrigger value="once-off" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:text-primary font-semibold">Once-off payments</TabsTrigger>
              </TabsList>
              <TabsContent value="recipient" className="pt-0 bg-white rounded-b-lg border border-t-0">
                 {isLoading ? (
                    <div className="p-8 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                 ) : savedPayments.length > 0 ? (
                    savedPayments.map(tx => <PaymentItem key={tx.id} tx={tx} />)
                 ) : (
                    <p className="text-gray-500 text-sm text-center py-8">There are no recipient payments to display.</p>
                 )}
              </TabsContent>
              <TabsContent value="once-off" className="pt-0 bg-white rounded-b-lg border border-t-0">
                {isLoading ? (
                    <div className="p-8 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                ) : onceOffPayments.length > 0 ? (
                    onceOffPayments.map(tx => <PaymentItem key={tx.id} tx={tx} />)
                ) : (
                   <p className="text-gray-500 text-sm text-center py-8">There are no once-off payments to display.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
      </main>
    </div>
  );
}