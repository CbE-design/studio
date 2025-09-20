
'use client';

import Link from 'next/link';
import { Home, CreditCard, PlusCircle, Users, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { TransactModal } from './transact-modal';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/cards', label: 'Cards', icon: CreditCard },
  { href: '#', label: 'Transact', icon: PlusCircle, isTransact: true },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '#', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const handleTransactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="border-t bg-background">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
             item.isTransact ? (
              <button
                key={item.label}
                onClick={handleTransactClick}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-[#009C6D] transition-colors"
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} key={item.label}>
                <div className={cn(
                  "flex flex-col items-center gap-1 hover:text-[#009C6D] transition-colors",
                  isActive(item.href) ? 'text-[#009C6D]' : 'text-muted-foreground'
                )}>
                  <item.icon className="h-6 w-6" />
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
