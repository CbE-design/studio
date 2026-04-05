'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { TransactModal } from './transact-modal';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const OverviewIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CardsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="14" x2="8" y2="14" />
    <line x1="12" y1="14" x2="14" y2="14" />
  </svg>
);

const RecipientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="17" r="3" />
    <line x1="22" y1="22" x2="19.65" y2="19.65" />
  </svg>
);

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: OverviewIcon },
  { href: '/cards', label: 'Cards', icon: CardsIcon },
  { href: '#', label: 'Transact', isTransact: true },
  { href: '/recipients', label: 'Recipients', icon: RecipientsIcon },
  { href: '/more', label: 'More', icon: () => <MoreHorizontal strokeWidth={2} className="h-6 w-6" /> },
];

export function BottomNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const handleTransactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname.startsWith('/dashboard') || pathname.startsWith('/account');
    if (href === '/cards') return pathname.startsWith('/cards');
    if (href === '/recipients') return pathname.startsWith('/recipients');
    if (href === '/more') return pathname.startsWith('/more');
    return pathname === href;
  };

  return (
    <>
      <nav className="relative border-t bg-white pb-[env(safe-area-inset-bottom)]" style={{ borderTopColor: '#e5e7eb' }}>
        <div className="flex justify-around items-end h-[60px] px-1">
          {navItems.map((item) => {
            if (item.isTransact) {
              return (
                <button
                  key={item.label}
                  onClick={handleTransactClick}
                  className="flex-1 flex flex-col items-center justify-end pb-2 outline-none relative"
                  style={{ marginBottom: '0px' }}
                >
                  <div
                    className="absolute -top-7 flex flex-col items-center"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shadow-lg"
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: '#007a33',
                        boxShadow: '0 4px 14px rgba(0,122,51,0.45)',
                        border: '3px solid white',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 mt-1">{item.label}</span>
                  </div>
                </button>
              );
            }

            const active = isActive(item.href);
            const IconComponent = item.icon as React.ComponentType<{ active?: boolean }>;

            return (
              <Link href={item.href} key={item.label} className="flex-1 flex flex-col items-center justify-end pb-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200",
                    active ? "bg-primary/10 text-primary" : "text-gray-500"
                  )}>
                    <IconComponent active={active} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    active ? "text-primary font-semibold" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      <TransactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
