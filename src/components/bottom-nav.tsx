import Link from 'next/link';
import { Home, CreditCard, PlusCircle, Users, MoreHorizontal } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home, active: true },
  { href: '#', label: 'Cards', icon: CreditCard },
  { href: '#', label: 'Transact', icon: PlusCircle },
  { href: '#', label: 'Recipients', icon: Users },
  { href: '#', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  return (
    <nav className="border-t bg-background">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label}>
            <div className={`flex flex-col items-center gap-1 ${item.active ? 'text-[#009C6D]' : 'text-muted-foreground'} hover:text-[#009C6D] transition-colors`}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
