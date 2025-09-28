
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase-provider';
import type { Beneficiary } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

const BankIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
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

const NoTransactionsIcon = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 text-primary">
        <path d="M42.6667 8H18.6667C16.8856 8 15.1793 8.70238 13.9289 9.95281C12.6785 11.2032 12 12.9095 12 14.6667V49.3333C12 51.0905 12.6785 52.7968 13.9289 54.0472C15.1793 55.2976 16.8856 56 18.6667 56H45.3333C47.1144 56 48.8207 55.2976 50.0711 54.0472C51.3215 52.7968 52 51.0905 52 49.3333V17.3333L42.6667 8Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21.3333 26.6667H42.6667" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21.3333 37.3333H42.6667" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21.3333 48H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M42.6667 8V17.3333H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LoadingSkeleton = () => (
    <div className="p-4 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);


const tabs = ['Details', 'History'];

export default function RecipientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const recipientId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [activeTab, setActiveTab] = useState('Details');
  const [recipient, setRecipient] = useState<Beneficiary | null>(null);
  const [isRecipientLoading, setIsRecipientLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user?.uid || !recipientId) {
        if (!isUserLoading) {
            setIsRecipientLoading(false);
        }
        return;
    }

    const fetchRecipient = async () => {
        setIsRecipientLoading(true);
        try {
            const docRef = doc(firestore, 'users', user.uid, 'beneficiaries', recipientId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setRecipient({ id: docSnap.id, ...docSnap.data() } as Beneficiary);
            } else {
                console.log("No such recipient!");
                setRecipient(null);
            }
        } catch (error) {
            console.error("Error fetching recipient:", error);
            setRecipient(null);
        } finally {
            setIsRecipientLoading(false);
        }
    };

    fetchRecipient();
  }, [firestore, user?.uid, recipientId, isUserLoading]);
  
  const isLoading = isUserLoading || isRecipientLoading;

  if (isLoading) {
    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="bg-white text-gray-800 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto px-4 pt-6">
                <LoadingSkeleton />
            </main>
        </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center p-4">
        <p className="text-xl text-destructive-foreground bg-destructive p-4 rounded-md">Recipient not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length-1]) {
      return `${names[0][0]}${names[names.length-1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white text-gray-800 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <Button variant="link" className="text-primary font-semibold text-lg p-0 h-auto">
            Edit
        </Button>
      </header>
      
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="text-2xl bg-gray-100 text-primary font-semibold">
                {getInitials(recipient.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-gray-800">{recipient.name}</h1>
        </div>
        
        <div className="border-b sticky top-[73px] z-10 bg-white -mx-4 px-4">
            <div className="flex">
            {tabs.map((tab) => (
                <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                    "py-3 text-base font-medium cursor-pointer text-gray-500 w-1/2 text-center",
                    activeTab === tab && "text-primary border-b-2 border-primary"
                )}
                >
                {tab}
                </div>
            ))}
            </div>
        </div>

        {activeTab === 'Details' && (
            <div className="py-6">
                <h2 className="text-sm font-bold text-gray-500 mb-4">BANK ACCOUNT</h2>

                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-grow">
                            <Label htmlFor="bank-name" className="text-gray-500 text-xs">Bank name</Label>
                            <Input id="bank-name" value={recipient.bank} readOnly className="bg-gray-100 pr-10 text-gray-500" />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-[-2px] h-5 w-5 text-gray-400" />
                        </div>
                        <BankIcon />
                    </div>

                    <div>
                        <Label htmlFor="account-number" className="text-gray-500 text-xs">Account number</Label>
                        <Input id="account-number" value={recipient.accountNumber} readOnly className="bg-gray-100 text-gray-500" />
                    </div>
                    
                    <div>
                        <Label htmlFor="your-reference" className="text-gray-500 text-xs">Your reference</Label>
                        <Input id="your-reference" defaultValue="Van Schalkwyk Family Trust" className="bg-white" />
                    </div>

                    <div>
                        <Label htmlFor="recipient-reference" className="text-gray-500 text-xs">Recipient's reference</Label>
                        <Input id="recipient-reference" defaultValue="Van Schalkwyk Family Trust" className="bg-white" />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'History' && (
            <div className="flex flex-col items-center justify-center text-center h-full py-12">
              <NoTransactionsIcon />
              <h2 className="text-xl font-bold text-gray-800 mb-2">You don't have any transactions yet</h2>
              <p className="text-gray-500">Your transaction history will appear once you have completed a transaction</p>
            </div>
        )}
      </main>
    </div>
  );
}
