
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
const shopImg = PlaceHolderImages.find(img => img.id === 'widget-shop');
const insureImg = PlaceHolderImages.find(img => img.id === 'widget-insure');
const applicationsImg = PlaceHolderImages.find(img => img.id === 'widget-applications');
const quickPayImg = PlaceHolderImages.find(img => img.id === 'widget-quick-pay');
const getCashImg = PlaceHolderImages.find(img => img.id === 'widget-get-cash');

const widgets = [
  { icon: ShieldCheck, label: 'Approvals', href: '/approvals', isNew: true },
  { src: applicationsImg?.imageUrl, hint: applicationsImg?.imageHint, label: 'Applications', href: '#' },
  { src: insureImg?.imageUrl, hint: insureImg?.imageHint, label: 'Insure', href: '#' },
  { src: shopImg?.imageUrl, hint: shopImg?.imageHint, label: 'Shop', href: '#' },
  { src: latestImg?.imageUrl, hint: latestImg?.imageHint, label: 'Latest', href: '#' },
  { src: quickPayImg?.imageUrl, hint: quickPayImg?.imageHint, label: 'Quick Pay', href: '#' },
  { src: getCashImg?.imageUrl, hint: getCashImg?.imageHint, label: 'Get cash', href: '#' },
  { src: homeLoansImg?.imageUrl, hint: homeLoansImg?.imageHint, label: 'Home loans', href: '#' },
  { src: statementsImg?.imageUrl, hint: statementsImg?.imageHint, label: 'Statements and docs', href: '/documents' },
];

const WidgetItem = ({ src, icon: Icon, label, href, isNew, hint }: { src?: string, icon?: React.ElementType<{className?: string}>, label: string, href: string, isNew?: boolean, hint?: string }) => {
    return (
        <Link href={href}>
            <div className="flex flex-col items-center justify-start space-y-2 text-center h-full group">
                <div className="relative flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-all active:scale-95 overflow-hidden w-[50px] h-[50px]">
                    {isNew && (
                        <div className="absolute top-0 left-0 z-10 overflow-hidden w-[52px] h-[52px] pointer-events-none">
                            <div className="absolute -top-1 -left-1 bg-green-600 text-white text-[8px] font-bold uppercase leading-none rotate-[-45deg] origin-bottom-right px-6 py-1">
                                NEW
                            </div>
                        </div>
                    )}
                    <div className="relative flex items-center justify-center">
                        {src ? (
                            <div className="relative w-7 h-7">
                                <Image
                                    src={src}
                                    alt={`${label} icon`}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={hint}
                                />
                            </div>
                        ) : Icon ? (
                            <Icon className="text-primary h-6 w-6" strokeWidth={1.5} />
                        ) : null}
                    </div>
                </div>
                <p className="text-[11px] text-gray-700 font-normal h-8 flex items-start justify-center text-center px-0.5 leading-tight">{label}</p>
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
              <Skeleton className="h-4 w-4 rounded-full bg-white/20" />
            </div>
          </div>
        </header>
    </div>

    <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="brand-header px-4 pt-8 pb-8">
            <Skeleton className="h-40 w-full bg-white/20 rounded-lg" />
        </div>
        <div className="p-4">
            <Skeleton className="h-24 w-full mb-6 rounded-lg bg-gray-200" />
            <Skeleton className="h-8 w-1/3 mb-4 bg-gray-200" />
            <div className="grid grid-cols-4 gap-y-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton className="w-[72px] h-[72px] bg-gray-200 rounded-2xl" />
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
      <header className="sticky top-0 z-50 brand-header px-4 py-2 text-white shadow-sm shrink-0">
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-4 overflow-hidden">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7"
                alt="Nedbank Logo"
                width={28}
                height={28}
                className="flex-shrink-0"
              />
              <span className="font-normal text-lg uppercase truncate tracking-wide">
                {user.displayName || 'DICKSON FAMILY TRUST'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white flex-shrink-0">
              <Link href="/notifications" className="relative p-1">
                <div className={cn('relative w-5 h-5 bg-transparent', isBellRinging && 'animate-ring')}>
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320141309.png?alt=media&token=1836ae99-d919-48db-85fe-013baef40979"
                    alt="Notifications"
                    fill
                    className="object-contain"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute top-[1px] right-[1px] h-2 w-2 rounded-full bg-[#9fff00] border border-[#004d00] z-10" />
                  )}
                </div>
              </Link>
              <Link href="/ai-chat" className="p-1">
                  <MessageIcon />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        <div className="brand-header px-4 pt-6 pb-3 shadow-md">
          <div className="relative z-10">
            <AccountsCarousel />
          </div>
        </div>

        <main className="flex flex-col bg-transparent">
          <div className="px-6 pt-2 pb-0">
            <div className="relative aspect-[16/7] w-full">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/IMG_20260303_210333.jpg?alt=media&token=bfc49ba7-9c39-41aa-a85b-b7b2a3ec9dc0"
                alt="Advertisement banner"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="px-6 pt-2 pb-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 tracking-tight">My widgets</h2>
            <div className="grid grid-cols-4 gap-x-3 gap-y-6">
              {widgets.map((widget) => (
                <WidgetItem
                  key={widget.label}
                  src={widget.src}
                  icon={widget.icon}
                  label={widget.label}
                  href={widget.href}
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
