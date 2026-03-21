'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AccountsCarousel } from '@/components/accounts-carousel';
import { useUser, useAllTransactions } from '@/firebase-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative w-4 h-4 flex items-center justify-center bg-transparent", className)}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_172101952.png?alt=media&token=2d52b45c-6169-486b-8c04-8e3965a21d47"
      alt="Messages"
      fill
      className="object-contain"
    />
  </div>
);

const homeLoansImg = PlaceHolderImages.find(img => img.id === 'widget-home-loans');
const latestImg = PlaceHolderImages.find(img => img.id === 'widget-latest');
const statementsImg = PlaceHolderImages.find(img => img.id === 'widget-statements');

const widgets = [
  { icon: ShieldCheck, label: 'Approvals', href: '/approvals', isNew: true },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758629149375.jpg?alt=media&token=485765e5-456f-412c-8da5-751ff5991dd5", label: 'Applications', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758630016360.jpg?alt=media&token=a946409a-39bd-47d1-ac07-9a00dca954cb", label: 'Insure', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758633570031.jpg?alt=media&token=b776f61f-926e-48ab-9f7c-9b18821c8b02", label: 'Shop', href: '#' },
  { src: latestImg?.imageUrl, hint: latestImg?.imageHint, label: 'Latest', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635889725.jpg?alt=media&token=7ac2249c-b95f-43b6-83e6-80a4fd291ab2", label: 'Quick Pay', href: '#' },
  { src: "https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758636434590.jpg?alt=media&token=9a2b5c0a-b399-4780-981a-3bd21e8d55e9", label: 'Get cash', href: '#' },
  { src: homeLoansImg?.imageUrl, hint: homeLoansImg?.imageHint, label: 'Home loans', href: '#' },
  { src: statementsImg?.imageUrl, hint: statementsImg?.imageHint, label: 'Statements and docs', href: '/documents' },
];

const WidgetItem = ({ src, icon: Icon, label, href, isNew, hint }: { src?: string, icon?: React.ElementType<{className?: string}>, label: string, href: string, isNew?: boolean, hint?: string }) => {
    return (
        <Link href={href}>
            <div className="flex flex-col items-center justify-start space-y-1.5 text-center h-full group">
                 <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-lg shadow-sm border border-gray-200 group-hover:shadow-md transition-shadow overflow-hidden">
                    {isNew && (
                        <div className="absolute top-0 right-0 px-1 py-0.5 text-[7px] font-bold text-white bg-green-600 rounded-bl-sm z-10 uppercase leading-none">
                            New
                        </div>
                    )}
                    <div className="relative flex items-center justify-center">
                       {src ? (
                            <div className="relative w-8 h-8">
                                <Image 
                                    src={src}
                                    alt={`${label} icon`}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={hint}
                                />
                            </div>
                        ) : Icon ? (
                            <Icon className="h-6 w-6 text-primary" />
                        ) : null}
                    </div>
                </div>
                <p className="text-[10px] text-gray-700 font-medium h-8 flex items-center justify-center text-center px-0.5 leading-tight">{label}</p>
            </div>
        </Link>
    );
};

const LoadingSkeleton = () => (
  <div className="flex flex-col h-full bg-white text-black">
    <div className="brand-header text-white p-4">
        <header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 overflow-hidden">
              <Skeleton className="w-6 h-6 rounded-md bg-white/20" />
              <Skeleton className="h-6 w-48 bg-white/20" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
            </div>
          </div>
        </header>
    </div>

    <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="gradient-background px-4 pt-8 pb-8">
            <Skeleton className="h-40 w-full bg-white/20 rounded-lg" />
        </div>
        <div className="p-4">
            <Skeleton className="h-24 w-full mb-6 rounded-lg bg-gray-200" />
            <Skeleton className="h-8 w-1/3 mb-4 bg-gray-200" />
            <div className="grid grid-cols-4 gap-y-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton className="w-14 h-14 bg-gray-200 rounded-lg" />
                  <Skeleton className="w-14 h-4 bg-gray-200 rounded-md" />
                </div>
              ))}
            </div>
        </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { transactions, isLoading: isTransactionsLoading } = useAllTransactions();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellRinging, setIsBellRinging] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isTransactionsLoading || transactions.length === 0) return;

    try {
        const storedIdsValue = localStorage.getItem('readTransactionIds');
        const readIds = storedIdsValue ? JSON.parse(storedIdsValue) : [];
        const newUnreadCount = transactions.filter(tx => !readIds.includes(tx.id)).length;
        setUnreadCount(newUnreadCount);

        if (newUnreadCount > 0) {
            setIsBellRinging(true);
            const timer = setTimeout(() => setIsBellRinging(false), 30000);
            return () => clearTimeout(timer);
        }
    } catch (e) {
        console.error("Failed to parse readTransactionIds from localStorage", e);
        setUnreadCount(transactions.length);
    }
  }, [transactions, isTransactionsLoading]);

  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Standalone Sticky Header */}
      <header className="sticky top-0 z-50 brand-header p-4 text-white shadow-sm shrink-0">
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 overflow-hidden">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7"
                alt="Nedbank Logo"
                width={24}
                height={24}
                className="w-6 h-6 flex-shrink-0"
              />
              <span className="font-normal text-xl uppercase truncate max-w-[180px]">
                {user.displayName || 'DICKSON FAMILY TRUST'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-white flex-shrink-0">
              <Link href="/notifications">
                <div className={cn('relative w-5 h-5 bg-transparent', isBellRinging && 'animate-ring')}>
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320141309.png?alt=media&token=1836ae99-d919-48db-85fe-013baef40979"
                    alt="Notifications"
                    fill
                    className="object-contain"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-lime-400 border border-green-800 z-10" />
                  )}
                </div>
              </Link>
              <Link href="/ai-chat">
                  <MessageIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="gradient-background px-4 pt-8 pb-8">
          <div className="relative z-10">
            <AccountsCarousel />
          </div>
        </div>

        <main className="flex flex-col bg-white">
          <div className="px-6 py-4 mt-2 flex justify-center">
            <div className="relative w-full aspect-[16/5] p-1">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/IMG_20260303_210333.jpg?alt=media&token=bfc49ba7-9c39-41aa-a85b-b7b2a3ec9dc0"
                alt="Advertisement banner"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="p-4 mt-2">
            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <div className="grid grid-cols-4 gap-x-2 gap-y-4">
              {widgets.map((widget) => (
                <WidgetItem
                  key={widget.label}
                  src={widget.src}
                  icon={widget.icon}
                  label={widget.label}
                  href={widget.href}
                  isNew={widget.isNew}
                  hint={widget.hint}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
