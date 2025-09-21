
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
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Announcements } from '@/components/announcements';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/data';


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

async function getAccounts(): Promise<Account[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Account',
        type: data.type || 'Cheque',
        accountNumber: data.accountNumber || 'N/A',
        balance: data.balance !== undefined ? data.balance : 0,
        currency: data.currency || 'ZAR',
      };
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const accounts = await getAccounts();

  const slides = [
    {
      title: 'Accounts',
      content: (
        <div className="space-y-2">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <Link href={`/account/${account.id}`} key={account.id}>
                <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0 cursor-pointer">
                  <div>
                    <p className="text-sm">{account.name}</p>
                    <p className="text-lg font-bold">{formatCurrency(account.balance, account.currency)}</p>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </Link>
            ))
          ) : (
             <div className="text-center py-4">
                <p className="text-sm">No accounts found.</p>
                <p className="text-xs text-white/80">Please add account data to your 'accounts' collection in Firestore.</p>
              </div>
          )}
        </div>
      ),
    },
    {
      title: 'Rewards',
      content: (
         <div className="space-y-2">
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-sm">Greenbacks Rewards</p>
              <p className="text-lg font-bold">GB 0</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'International banking and travel',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Incoming and outgoing payments</p>
              <p className="text-lg font-bold">International payments</p>
            </div>
            <Button variant="link" className="text-white font-bold">View</Button>
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-xs">Foreign Currency Accounts</p>
              <p className="text-lg font-bold">Your currencies</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'Savings & Investments',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Tax certificates</p>
              <p className="text-lg font-bold">Tax certificates</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-lg font-bold">Save & Invest</p>
            </div>
             <Button variant="link" className="font-bold text-yellow-400">Explore options</Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Insurance',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-lg font-bold">My policies and applications</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-lg font-bold">New policy</p>
            </div>
             <Button variant="link" className="font-bold text-yellow-400">Get cover</Button>
          </div>
        </div>
      ),
    },
  ];


  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 space-y-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
              alt="Nedbank Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-xl">Van Schalkwyk Family Trust</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-6 w-6" />
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-primary text-primary-foreground p-4">
            <Carousel>
                <CarouselContent>
                {slides.map((slide, index) => (
                    <CarouselItem key={index}>
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-xl font-bold">{slide.title}</h1>
                        <Eye className="h-6 w-6" />
                    </div>
                    {slide.content}
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
        </div>
        <div className="p-4">
            <Announcements />
            <Card className="my-6 shadow-md border rounded-lg overflow-hidden">
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
                <div className={cn("p-3 rounded-lg shadow-sm border", index % 2 === 0 ? 'bg-primary/10' : 'bg-white')}>
                    <widget.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-gray-600">{widget.label}</p>
                {widget.new && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-primary rounded-full">
                    New
                    </div>
                )}
                {widget.count && (
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 flex items-center justify-center h-5 w-5 text-xs font-semibold text-white bg-primary rounded-full">
                    {widget.count}
                    </div>
                )}
                </div>
            ))}
            </div>
        </div>
      </main>
    </div>
  );
}
