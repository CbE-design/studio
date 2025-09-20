'use client';

import Link from 'next/link';
import { Home, CreditCard, PlusCircle, Users, MoreHorizontal, X, ArrowRightLeft, Receipt } from 'lucide-react';
import { useState } from 'react';
import { TransactModal } from './transact-modal';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home, active: true },
  { href: '#', label: 'Cards', icon: CreditCard },
  { href: '#', label: 'Transact', icon: PlusCircle, isTransact: true },
  { href: '#', label: 'Recipients', icon: Users },
  { href: '#', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTransactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <nav className="border-t bg-background">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
             item.isTransact ? (
              <button
                key={item.label}
                onClick={handleTransactClick}
                className={`flex flex-col items-center gap-1 ${item.active ? 'text-[#009C6D]' : 'text-muted-foreground'} hover:text-[#009C6D] transition-colors`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} key={item.label}>
                <div className={`flex flex-col items-center gap-1 ${item.active ? 'text-[#009C6D]' : 'text-muted-foreground'} hover:text-[#009C6D] transition-colors`}>
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
