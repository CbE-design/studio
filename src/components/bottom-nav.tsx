
'use client';

import Link from 'next/link';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { TransactModal } from './transact-modal';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Custom SVG Icons to match the user's image
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CardsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="14" x2="8" y2="14" />
    <line x1="12" y1="14" x2="14" y2="14" />
  </svg>
);

const RecipientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="17" r="3" />
    <line x1="22" y1="22" x2="19.65" y2="19.65" />
  </svg>
);


const navItems = [
  { href: '/dashboard', label: 'Overview', icon: OverviewIcon },
  { href: '/cards', label: 'Cards', icon: CardsIcon },
  { href: '#', label: 'Transact', icon: () => <Plus strokeWidth={1.5} />, isTransact: true },
  { href: '/recipients', label: 'Recipients', icon: RecipientsIcon },
  { href: '/more', label: 'More', icon: () => <MoreHorizontal strokeWidth={1.5} /> },
];

export function BottomNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const handleTransactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const isActive = (href: string) => {
    // Exact match for most, but startsWith for dashboard/recipients to catch sub-pages
    if (href === '/dashboard') return pathname.startsWith('/dashboard') || pathname.startsWith('/account');
    if (href === '/cards') return pathname.startsWith('/cards');
    if (href === '/recipients') return pathname.startsWith('/recipients');
    if (href === '/more') return pathname.startsWith('/more');
    return pathname === href;
  }

  return (
    <>
      <nav className="border-t bg-white">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
             item.isTransact ? (
              <button
                key={item.label}
                onClick={handleTransactClick}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} key={item.label}>
                <div className={cn(
                  "flex flex-col items-center gap-1 hover:text-foreground transition-colors",
                  isActive(item.href) ? 'text-foreground font-bold' : 'text-muted-foreground'
                )}>
                  <item.icon />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            )
          ))}
        </div>
      </nav>
      <TransactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
