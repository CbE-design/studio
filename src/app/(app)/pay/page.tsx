
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const paymentOptions = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
        <path d="M12 6v1" />
        <path d="M12 11h.01" />
        <path d="M16 12.5a4 4 0 0 0-8 0" />
        <path d="M15 17.5c0 1.5-2.5 2.5-5 0" />
      </svg>
    ),
    title: 'Single payment',
    description: 'Make a once-off payment or pay a saved recipient.',
    href: '/pay/single',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 18v.01" />
      </svg>
    ),
    title: 'Send money',
    description: 'Send money to anyone with a South African cellphone number.',
    href: '#',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="6" cy="6" r="2" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="12" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    title: 'PayShap Request',
    description: 'Request and make payments with PayShap.',
    href: '#',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Bill payments',
    description: 'Add and manage your monthly bills. Earn great rewards.',
    href: '#',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="22" x2="12" y2="18" />
        <path d="M12 18h.01" />
        <path d="M18 14H6" />
        <path d="M18 10H6" />
        <path d="M18 6H6" />
        <path d="M2 22h20" />
        <path d="M2 6l10-4 10 4" />
      </svg>
    ),
    title: 'Government payment',
    description: 'Complete and view government payments.',
    href: '#',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'International payments',
    description: 'View, receive and make payments, or send money internationally.',
    href: '#',
  },
];

export default function PayPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">What would you like to do?</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {paymentOptions.map((option, index) => (
              <Link href={option.href || '#'} key={option.title}>
                <div
                  className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index < paymentOptions.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="mr-4">{option.icon}</div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-800 text-lg">{option.title}</h2>
                    <p className="text-gray-500 text-sm">{option.description}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your recent payments</h2>
            <Tabs defaultValue="recipient" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
                <TabsTrigger value="recipient" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:text-primary font-semibold">Recipient payments</TabsTrigger>
                <TabsTrigger value="once-off" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:text-primary font-semibold">Once-off payments</TabsTrigger>
              </TabsList>
              <TabsContent value="recipient" className="pt-4">
                <p className="text-gray-500 text-sm">There are no recipient payments to display.</p>
              </TabsContent>
              <TabsContent value="once-off" className="pt-4">
                 <p className="text-gray-500 text-sm">There are no once-off payments to display.</p>
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </main>
    </div>
  );
}
