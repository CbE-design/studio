
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Smartphone, Layers, Ticket, Lightbulb, Lamp, ShoppingCart, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const buyOptions = [
  {
    icon: (
        <div className="relative h-8 w-8 text-primary">
            <Smartphone className="absolute top-0 left-2 h-7 w-7" />
            <div className="absolute bottom-0 left-0 h-4 w-4 bg-white border-2 border-primary rounded-sm flex flex-col justify-center items-center p-0.5 space-y-px">
                <div className="w-full h-px bg-primary"></div>
                <div className="w-full h-px bg-primary"></div>
                <div className="w-full h-px bg-primary"></div>
            </div>
        </div>
    ),
    title: 'Nedbank Connect',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Buy Prepaid data, airtime or SMSs',
  },
  {
    icon: <Ticket className="h-8 w-8 text-primary" />,
    title: 'Buy gift voucher',
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: 'Buy or claim prepaid electricity or water.',
  },
  {
    icon: <Gamepad2 className="h-8 w-8 text-primary" />,
    title: 'Play Lottery games',
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: 'Explore Shop',
  },
];

export default function BuyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Buy</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">What would you like to do?</h1>
          
          <div className="bg-white rounded-lg">
            {buyOptions.map((option, index) => (
              <div
                key={option.title}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index < buyOptions.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="mr-4">{option.icon}</div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-700 text-base">{option.title}</h2>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="p-6 bg-gray-50 text-xs text-gray-500">
        <p className="mb-2">
            Please take note that the terms and conditions of the service provider/supplier apply to all value-added services (VAS) purchases.
        </p>
        <p>
            By purchasing any of the VAS products, you accept the <a href="#" className="text-primary underline">terms and conditions</a>.
        </p>
      </footer>
    </div>
  );
}
