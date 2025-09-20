
'use client';

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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const accounts = [
  { id: '1', name: 'Savvy Bundle Current Account', balance: 'R0.00' },
  { id: '2', name: 'CURRENT ACCOUNT', balance: 'R0.83' },
  { id: '3', name: 'MyPockets(2/10)', balance: 'R4.00' },
  { id: '4', name: 'Savings Account', balance: 'R1250.00' },
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

const slides = [
  {
    title: 'Accounts',
    content: (
      <div className="space-y-2">
        {accounts.map((account, index) => (
          <Link href={`/account/${account.id}`} key={account.id}>
            <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0 cursor-pointer">
              <div>
                <p className="text-sm">{account.name}</p>
                <p className="text-lg font-bold">{account.balance}</p>
              </div>
              <ChevronRight className="h-6 w-6" />
            </div>
          </Link>
        ))}
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
           <Button variant="link" className="font-bold" style={{ color: '#F7C400' }}>Explore options</Button>
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
           <Button variant="link" className="font-bold" style={{ color: '#F7C400' }}>Get cover</Button>
        </div>
      </div>
    ),
  },
];

export default function DashboardPage() {
  const [api, setApi] = React.useState<any>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="bg-[#009C6D] text-white p-4 space-y-4 sticky top-0 z-10">
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
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-[#009C6D] text-white p-4">
            <Carousel setApi={setApi}>
                <CarouselContent>
                {slides.map((slide, index) => (
                    <CarouselItem key={index}>
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">{slide.title}</h1>
                        { index === 0 && <Eye className="h-6 w-6" /> }
                    </div>
                    {slide.content}
                    </CarouselItem>
                ))}
                </CarouselContent>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0 text-white" variant="link" />
                    <div className="flex items-center gap-2">
                    {Array.from({ length: count }).map((_, index) => (
                        <span
                        key={index}
                        className={`h-2 w-2 rounded-full ${current === index ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                    </div>
                    <CarouselNext className="static translate-y-0 text-white" variant="link"/>
                </div>
            </Carousel>
        </div>
        <div className="p-4">
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
        </div>
      </main>
    </div>
  );
}
