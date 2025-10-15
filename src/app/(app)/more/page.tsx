

'use client';

import {
  Bell,
  FileText,
  Phone,
  Lock,
  Settings,
  ChevronRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/app/lib/definitions';
import { parseISO } from 'date-fns';

const NedbankConnectIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="10" height="16" x="7" y="4" rx="2" />
    <path d="M12 14h.01" />
  </svg>
);

const ApplicationsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect width="8" height="4" x="8" y="2" rx="1" />
    <path d="M12 12h.01" />
    <path d="M12 16h.01" />
  </svg>
);

export default function MorePage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = useState(0);

  const accountsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);
  const { data: accounts } = useCollection(accountsQuery);
  
  useEffect(() => {
    if (!accounts || isUserLoading) return;

    const fetchAndCountTransactions = async () => {
        if (!user?.uid) return;

        let allTransactions: Transaction[] = [];
        for (const account of accounts) {
            const transactionsCollectionRef = collection(firestore, 'users', user.uid, 'bankAccounts', account.id, 'transactions');
            const transactionsSnapshot = await getDocs(query(transactionsCollectionRef));
            transactionsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.date && data.transactionType !== 'BANK_FEE') {
                     allTransactions.push({ id: doc.id, ...data } as Transaction);
                }
            });
        }
        
        try {
            const readIds = JSON.parse(localStorage.getItem('readTransactionIds') || '[]');
            const newUnreadCount = allTransactions.filter(tx => !readIds.includes(tx.id)).length;
            setUnreadCount(newUnreadCount);
        } catch (e) {
            console.error("Failed to parse readTransactionIds from localStorage", e);
            setUnreadCount(allTransactions.length);
        }
    };
    
    fetchAndCountTransactions();
  }, [accounts, firestore, user?.uid, isUserLoading]);


  const menuItems = [
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      badge: unreadCount > 0 ? String(unreadCount) : null,
      badgeColor: 'bg-red-500',
    },
    {
      icon: ApplicationsIcon,
      label: 'Applications',
      href: '#',
    },
    {
      icon: NedbankConnectIcon,
      label: 'Nedbank Connect',
      href: '#',
      badge: 'New',
      badgeColor: 'bg-green-500',
    },
    {
      icon: FileText,
      label: 'Statements and Documents',
      href: '/documents',
    },
    {
      icon: Phone,
      label: 'Get in touch',
      href: '#',
    },
    {
      icon: Lock,
      label: 'Login and security',
      href: '#',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '#',
    },
  ];

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'Could not sign you out. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background h-16" />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white pb-6 shadow-sm">
          <div className="flex justify-around items-start p-6 text-center">
            <div className="flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-2 border-2 border-primary">
                <AvatarFallback className="text-2xl bg-gray-100 text-primary font-bold">
                  CD
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-gray-800">
                CORRIE DIRK VAN SCHALKWYK
              </p>
              <p className="text-sm text-gray-500">3120634863</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 mb-2 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700">Link a Profile</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white">
          <ul className="divide-y divide-gray-200">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>
                  <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                      <item.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <span className="flex-1 font-medium text-gray-700">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge className={`${item.badgeColor} text-white mr-2`}>
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 mt-4">
          <Button
            variant="outline"
            className="w-full justify-start text-lg p-6 border-gray-300"
            onClick={handleLogout}
          >
            <LogOut className="mr-4 h-6 w-6 text-primary" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
}
