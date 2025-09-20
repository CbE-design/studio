
import {
  Bell,
  ChevronRight,
  Eye,
  MessageSquare,
  BadgePercent,
  FileText,
  Shield,
  Phone,
  Car,
  ShoppingCart,
  Send,
  Gift,
  HandCoins,
  AppWindow,
  Home,
  FileSearch,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const accounts = [
  { name: 'Savvy Bundle Current Account', balance: 'R0.00' },
  { name: 'CURRENT ACCOUNT', balance: 'R0.83' },
  { name: 'MyPockets(2/10)', balance: 'R4.00' },
  { name: 'Savings Account', balance: 'R1250.00' },
];

const widgets = [
  { icon: BadgePercent, label: 'Offers for you' },
  { icon: FileText, label: 'Applications' },
  { icon: Shield, label: 'Insure' },
  { icon: Phone, label: 'Nedbank Connect', new: true },
  { icon: Car, label: 'Discs and fines' },
  { icon: ShoppingCart, label: 'Shop', count: 1 },
  { icon: Send, label: 'PayShap' },
  { icon: Gift, label: 'Latest' },
  { icon: HandCoins, label: 'Quick Pay' },
  { icon: AppWindow, label: 'Get cash' },
  { icon: Home, label: 'Home loans' },
  { icon: FileSearch, label: 'Statements and docs' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="bg-[#009C6D] text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold">Corrie</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-6 w-6" />
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <Eye className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          {accounts.map((account, index) => (
            <div key={index} className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0">
              <div>
                <p className="text-sm">{account.name}</p>
                <p className="text-lg font-bold">{account.balance}</p>
              </div>
              <ChevronRight className="h-6 w-6" />
            </div>
          ))}
        </div>

      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <Card className="mb-6 shadow-md border rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Image
              src="https://picsum.photos/seed/nedbank-connect/600/100"
              alt="Nedbank Connect Banner"
              data-ai-hint="promotional banner"
              width={600}
              height={100}
              className="w-full"
            />
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          {widgets.map((widget, index) => (
            <div key={index} className="flex flex-col items-center gap-1 relative">
              <div className="p-3 bg-white rounded-lg shadow-sm border">
                <widget.icon className="h-8 w-8 text-[#009C6D]" />
              </div>
              <p className="text-xs text-gray-600">{widget.label}</p>
              {widget.new && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-[#009C6D] rounded-full">
                  New
                </div>
              )}
              {widget.count && (
                 <div className="absolute top-0 right-0 -mt-2 -mr-2 flex items-center justify-center h-5 w-5 text-xs font-semibold text-white bg-[#009C6D] rounded-full">
                  {widget.count}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
