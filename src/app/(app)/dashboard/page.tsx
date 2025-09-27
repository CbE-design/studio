
'use client';

import {
  Bell,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AccountsCarousel } from '@/components/accounts-carousel';
import { useUser } from '@/firebase-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Custom SVG Icons
const OffersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M7 10h12v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5Z"/><path d="M12 10V8a2 2 0 0 0-4 0v2"/><path d="M8 10a2 2 0 0 0-4 0v2h4"/><path d="M16 10a2 2 0 0 1 4 0v2h-4"/><path d="M12 10a2 2 0 0 1-4 0"/></svg>
);
const ApplicationsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 14h4"/><path d="M10 18h4"/><path d="M10 10h4"/></svg>
);
const InsureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a4 4 0 0 0 8 0 M12 12a4 4 0 0 0-8 0"/></svg>
);
const NedbankConnectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);
const DiscsAndFinesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M14 16.5 19 12l-5-4.5"/><path d="m10 7.5-5 4.5 5 4.5"/><path d="M2 12h11.5"/><path d="M17.5 12H22"/></svg>
);
const ShopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>
);
const PayShapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-primary h-8 w-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 16.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
);
const LatestIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-4-2V12"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M16 5.5a2.5 2.5 0 0 0-5 0"/></svg>
);
const QuickPayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z"/><path d="M12 6v6l4 2"/><path d="M16.2 7.8c3.2 1.2 5.3 4.9 4.1 8.2s-4.9 5.3-8.2 4.1-5.3-4.9-4.1-8.2c.8-2.3 2.6-4 4.8-4.8"/></svg>
);
const GetCashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M17 9V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/><path d="M17 9h.01"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M9 16h6"/></svg>
);
const HomeLoansIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const StatementsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);

const widgets = [
  { icon: OffersIcon, label: 'Offers for you', href: '#' },
  { icon: ApplicationsIcon, label: 'Applications', href: '#' },
  { icon: InsureIcon, label: 'Insure', href: '#' },
  { icon: NedbankConnectIcon, label: 'Nedbank Connect', new: true, href: '#' },
  { icon: DiscsAndFinesIcon, label: 'Discs and fines', href: '#' },
  { icon: ShopIcon, label: 'Shop', href: '#' },
  { icon: PayShapIcon, label: 'PayShap', href: '#' },
  { icon: LatestIcon, label: 'Latest', href: '#' },
  { icon: QuickPayIcon, label: 'Quick Pay', href: '#' },
  { icon: GetCashIcon, label: 'Get cash', href: '#' },
  { icon: HomeLoansIcon, label: 'Home loans', href: '#' },
  { icon: StatementsIcon, label: 'Statements and docs', href: '/documents' },
];

const WidgetItem = ({ icon: Icon, label, href, isNew }: { icon: React.ElementType, label: string, href: string, isNew?: boolean }) => (
    <Link href={href}>
        <div className="flex flex-col items-center justify-start space-y-2 text-center h-full">
            <div className="w-8 h-px bg-gray-300" />
            <div className="relative flex items-center justify-center w-12 h-12">
                {isNew && (
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-sm z-10">
                        New
                    </div>
                )}
                <Icon />
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <p className="text-xs text-gray-700 font-medium h-8 flex items-center text-center">{label}</p>
        </div>
    </Link>
);

const LoadingSkeleton = () => (
  <div className="flex flex-col h-full bg-white text-black">
    <header className="gradient-background text-primary-foreground p-4 space-y-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-md bg-white/20" />
          <Skeleton className="h-6 w-48 bg-white/20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
          <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
        </div>
      </div>
    </header>
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="gradient-background text-primary-foreground p-4">
        <Skeleton className="h-40 w-full bg-white/20 rounded-lg" />
      </div>
      <div className="p-4">
        <Skeleton className="h-24 w-full my-6 rounded-lg bg-gray-200" />
        <Skeleton className="h-8 w-1/3 mb-4 bg-gray-200" />
        <div className="grid grid-cols-4 gap-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
              <Skeleton className="w-16 h-4 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there is no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="gradient-background text-primary-foreground p-4 space-y-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
              alt="Nedbank Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-medium text-lg">Corrie</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5" />
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="gradient-background text-primary-foreground p-4">
            <AccountsCarousel />
        </div>
        <div className="p-4">
            <div className="my-4 mx-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-lg shadow-sm border border-gray-200">
                <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/CutPaste_2025-09-25_19-22-52-484.png?alt=media&token=611adbd9-a489-4019-99a0-d0aa83f6a21a"
                alt="Advertisement banner"
                data-ai-hint="advertisement banner"
                width={600}
                height={100}
                className="w-full"
                />
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <div className="grid grid-cols-4 gap-y-6">
              {widgets.map((widget, index) => (
                  <WidgetItem 
                    key={index} 
                    icon={widget.icon} 
                    label={widget.label} 
                    href={widget.href}
                    isNew={widget.new} 
                  />
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}
