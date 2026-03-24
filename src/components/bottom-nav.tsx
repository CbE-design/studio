'use client';

import Link from 'next/link';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { TransactModal } from './transact-modal';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Custom SVG Icons to match the branding with Android specs
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
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
  { href: '#', label: 'Transact', icon: () => <Plus strokeWidth={2.5} />, isTransact: true },
  { href: '/recipients', label: 'Recipients', icon: RecipientsIcon },
  { href: '/more', label: 'More', icon: () => <MoreHorizontal strokeWidth={2} /> },
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
      <nav className="border-t bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const content = (
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "relative flex items-center justify-center px-5 py-1 rounded-full transition-all duration-200",
                  active ? "bg-primary/10 text-primary" : "text-gray-500"
                )}>
                  <item.icon />
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  active ? "text-primary font-bold" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </div>
            );

            return item.isTransact ? (
              <button
                key={item.label}
                onClick={handleTransactClick}
                className="flex-1 flex flex-col items-center justify-center outline-none"
              >
                {content}
              </button>
            ) : (
              <Link href={item.href} key={item.label} className="flex-1 flex flex-col items-center justify-center">
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
      <TransactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}