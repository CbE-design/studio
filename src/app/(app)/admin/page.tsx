'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Shield, Bell, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const adminOptions = [
  {
    icon: <Bell className="h-8 w-8 text-primary" />,
    title: 'Send Notifications',
    description: 'Send SMS notifications to clients.',
    href: '/admin/notifications',
  },
  {
    icon: <Mail className="h-8 w-8 text-primary" />,
    title: 'Send Email',
    description: 'Send general email communications to clients.',
    href: '/admin/email',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Manage Users',
    description: 'View and manage user accounts.',
    href: '/admin/users',
  },
];

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield />
            Admin Panel
        </h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border">
            {adminOptions.map((option, index) => (
              <Link href={option.href} key={option.title}>
                <div
                  className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index < adminOptions.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="mr-4">{option.icon}</div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-800 text-base">{option.title}</h2>
                    <p className="text-muted-foreground text-sm">{option.description}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}