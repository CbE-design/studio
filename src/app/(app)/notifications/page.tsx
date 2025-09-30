
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const WrenchAndGearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 text-primary"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <path d="M15.73 9.4a2.43 2.43 0 0 1 0 5.2" />
    <path d="M4.27 9.4a2.43 2.43 0 0 0 0 5.2" />
  </svg>
);


const notificationOptions = [
  {
    title: 'Transactions',
    href: '/notifications/transactions',
  },
  {
    title: 'Messages',
    href: '#',
  },
  {
    title: 'Offers for you',
    href: '#',
  },
];

export default function NotificationsHubPage() {
  const router = useRouter();

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
          <Settings className="text-primary h-7 w-7" />
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
