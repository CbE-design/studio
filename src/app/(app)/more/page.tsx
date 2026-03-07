'use client';

import {
  FileText,
  Phone,
  Lock,
  Settings,
  ChevronRight,
  Plus,
  LogOut,
  Shield,
  Cpu,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useAllTransactions } from '@/firebase-provider';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const CustomBellIcon = ({className}: {className?: string}) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

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


  const menuSections = [
    {
      title: 'TRUST ADMINISTRATION',
      items: [
        {
          icon: ShieldCheck,
          label: 'Authorizations',
          href: '/approvals',
          badge: '2',
          badgeColor: 'bg-amber-500',
        },
        {
          icon: FileText,
          label: 'Statements and Documents',
          href: '/documents',
        },
        {
          icon: ApplicationsIcon,
          label: 'New Applications',
          href: '#',
        },
      ]
    },
    {
      title: 'SYSTEM INTEGRATION',
      items: [
        {
          icon: Cpu,
          label: 'CBS Core Bridge',
          href: '/cbs',
          badge: 'Online',
          badgeColor: 'bg-green-600',
        },
        {
          icon: Database,
          label: 'SAP ERP Ledger',
          href: '/saperp',
          badge: 'Synced',
          badgeColor: 'bg-blue-600',
        },
      ]
    },
    {
      title: 'COMMUNICATIONS',
      items: [
        {
          icon: CustomBellIcon,
          label: 'Notifications',
          href: '/notifications',
          badge: unreadCount > 0 ? String(unreadCount) : null,
          badgeColor: 'bg-red-500',
        },
        {
          icon: NedbankConnectIcon,
          label: 'Nedbank Connect',
          href: '#',
          badge: 'New',
          badgeColor: 'bg-green-500',
        },
        {
          icon: Phone,
          label: 'Get in touch',
          href: '#',
        },
      ]
    },
    {
      title: 'SECURITY & SETTINGS',
      items: [
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
        {
          icon: Shield,
          label: 'Admin Panel',
          href: '/admin',
        },
      ]
    }
  ];

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
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
      <header className="bg-transparent h-12" />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white pb-6 shadow-sm border-b">
          <div className="flex justify-around items-start p-6 text-center">
            <div className="flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-2 border-2 border-primary">
                <AvatarFallback className="text-2xl bg-gray-100 text-primary font-bold">
                  DT
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-gray-800">
                DICKSON FAMILY TRUST
              </p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Master Profile</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 mb-2 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700">Link Profile</p>
            </div>
          </div>
        </div>

        {menuSections.map((section) => (
          <div key={section.title} className="mt-6">
            <h2 className="px-4 mb-2 text-[10px] font-bold text-gray-400 tracking-widest uppercase">{section.title}</h2>
            <div className="bg-white border-y">
              <ul className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>
                      <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mr-4 border border-gray-100">
                          <item.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <span className="flex-1 font-medium text-gray-700 text-sm">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge className={`${item.badgeColor} text-[10px] font-bold text-white mr-2`}>
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        <div className="p-4 mt-8 mb-12">
          <Button
            variant="outline"
            className="w-full justify-start text-sm p-6 border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
            onClick={handleLogout}
          >
            <LogOut className="mr-4 h-5 w-5 text-primary" />
            Sign Out of Production
          </Button>
          <p className="text-center text-[9px] text-gray-400 mt-4 uppercase tracking-tighter">
            Application Version 2.4.0 (Production Node)
          </p>
        </div>
      </main>
    </div>
  );
}