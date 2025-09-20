import Link from 'next/link';
import { Home, Lock, ScanQrCode, Landmark, User } from 'lucide-react';

const navItems = [
  { href: '#', label: 'Latest', icon: Home },
  { href: '/login', label: 'Login', icon: Lock, active: true },
  { href: '#', label: 'Scan QR', icon: ScanQrCode },
  { href: '#', label: 'Balance', icon: Landmark },
  { href: '#', label: 'Applications', icon: User },
];

export function BottomNav() {
  return (
    <nav className="border-t bg-background">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label}>
            <div className={`flex flex-col items-center gap-1 ${item.active ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
