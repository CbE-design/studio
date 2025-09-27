
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CardPlaceholder = () => (
    <div className="relative w-full max-w-sm mx-auto aspect-[1.586] rounded-xl overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-green-700"></div>
      <div className="relative h-full p-6 flex flex-col justify-between">
        <div>
          <div className="w-12 h-8 bg-white/20 rounded-md"></div>
        </div>
        <div className="space-y-3">
          <div className="w-4/5 h-4 bg-white/20 rounded-full"></div>
          <div className="flex items-center gap-4">
            <div className="w-1/4 h-3 bg-white/20 rounded-full"></div>
            <div className="w-2/5 h-3 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 top-auto h-16 bg-black/10"></div>
    </div>
);

export default function CardsPage() {
  const [activeTab, setActiveTab] = useState('Physical');

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">My cards</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6 text-center space-y-8">
        <div className="flex justify-center">
            <div className="flex w-full max-w-sm bg-gray-200 rounded-lg p-1">
            <button
                onClick={() => setActiveTab('Physical')}
                className={cn(
                'w-1/2 py-2 rounded-md text-sm font-semibold transition-colors',
                activeTab === 'Physical'
                    ? 'bg-white text-gray-800 shadow'
                    : 'bg-transparent text-gray-500'
                )}
            >
                Physical cards
            </button>
            <button
                onClick={() => setActiveTab('Virtual')}
                className={cn(
                'w-1/2 py-2 rounded-md text-sm font-semibold transition-colors',
                activeTab === 'Virtual'
                    ? 'bg-white text-gray-800 shadow'
                    : 'bg-transparent text-gray-500'
                )}
            >
                Virtual cards
            </button>
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">You currently have no active cards.</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
            Once you have ordered or activated your cards, they will appear here. You will be able to manage limits, block and replace your cards.
            </p>
        </div>
        
        <CardPlaceholder />

        <div className="pt-4">
          <Button>Order a new card</Button>
        </div>
      </main>
    </div>
  );
}
