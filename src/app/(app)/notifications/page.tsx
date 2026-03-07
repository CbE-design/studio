'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUser, useAllTransactions } from '@/firebase-provider';
import { useEffect, useState } from 'react';

const ToolAndGearIcon = () => (
    <div className="relative h-7 w-7 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute top-0 left-0 w-[22px] h-[22px] -rotate-12">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute bottom-0 right-0">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>
        </svg>
    </div>
);


export default function NotificationsHubPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { transactions, isLoading: isTransactionsLoading } = useAllTransactions();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isTransactionsLoading || transactions.length === 0) {
        setUnreadCount(0);
        return;
    }

    try {
        const storedIdsValue = localStorage.getItem('readTransactionIds');
        const readIds = storedIdsValue ? JSON.parse(storedIdsValue) : [];
        const newUnreadCount = transactions.filter(tx => !readIds.includes(tx.id)).length;
        setUnreadCount(newUnreadCount);
    } catch (e) {
        console.error("Failed to parse readTransactionIds from localStorage", e);
        setUnreadCount(transactions.length);
    }
  }, [transactions, isTransactionsLoading]);

  const notificationOptions = [
    {
      title: 'Transactions',
      href: '/notifications/transactions',
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null,
    },
    {
      title: 'Messages',
      href: '#',
      badge: null,
    },
    {
      title: 'Offers for you',
      href: '#',
      badge: null,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
        <Button variant="ghost" size="icon">
          <ToolAndGearIcon />
        </Button>
      </header>
      
      <main className="flex-1 overflow-y-auto pt-2">
        <div className="bg-white">
          <ul className="divide-y divide-gray-200">
            {notificationOptions.map((option) => (
              <li key={option.title}>
                <Link href={option.href}>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                    <span className="flex-1 font-medium text-gray-700 text-lg">
                      {option.title}
                    </span>
                    {option.badge && (
                      <Badge className="bg-green-600 text-white mr-2">
                        {option.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}