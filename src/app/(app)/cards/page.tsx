'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const MastercardLogo = () => (
  <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-10">
    <rect width="38" height="24" rx="4" fill="transparent" />
    <circle cx="14" cy="12" r="9" fill="#EB001B" />
    <circle cx="24" cy="12" r="9" fill="#F79E1B" />
    <path d="M19 5.5a9 9 0 0 1 0 13A9 9 0 0 1 19 5.5z" fill="#FF5F00" />
  </svg>
);

const ChipIcon = () => (
  <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg" className="h-8 w-11">
    <rect x="0" y="0" width="40" height="30" rx="4" fill="#D4AF37" />
    <rect x="0" y="0" width="40" height="30" rx="4" fill="url(#chip-gradient)" />
    <rect x="13" y="0" width="1.5" height="30" fill="#B8962E" opacity="0.6" />
    <rect x="25.5" y="0" width="1.5" height="30" fill="#B8962E" opacity="0.6" />
    <rect x="0" y="9" width="40" height="1.5" fill="#B8962E" opacity="0.6" />
    <rect x="0" y="19.5" width="40" height="1.5" fill="#B8962E" opacity="0.6" />
    <rect x="14.5" y="9" width="11" height="12" rx="1.5" fill="#C9A227" />
    <defs>
      <linearGradient id="chip-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E8C84A" />
        <stop offset="50%" stopColor="#C9A227" />
        <stop offset="100%" stopColor="#A87C10" />
      </linearGradient>
    </defs>
  </svg>
);

const NedbankCard = ({ cardType }: { cardType: string }) => (
  <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1.586' }}>
    <div className="absolute inset-0 brand-header" />
    <div className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 40 L80 0 Z' fill='%23ffffff'/%3E%3Cpath d='M0 80 L40 40 L80 80 Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px',
      }}
    />
    <div className="relative h-full p-5 flex flex-col justify-between z-10">
      <div className="flex items-start justify-between">
        <ChipIcon />
        <div className="flex flex-col items-end gap-1">
          <div className="text-white font-bold text-lg tracking-widest leading-none">N</div>
          <div className="text-white/70 text-[8px] font-medium tracking-wider uppercase leading-none">nedbank</div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-white/80 text-xs tracking-[0.3em] font-mono">
          •••• •••• •••• ####
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-[8px] uppercase tracking-widest">Card Holder</p>
            <p className="text-white font-medium text-sm tracking-wider uppercase">Dickson Family Trust</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-white/60 text-[8px] uppercase tracking-widest">Expires</p>
              <p className="text-white font-medium text-sm tracking-wider">••/••</p>
            </div>
            <MastercardLogo />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EmptyCard = () => (
  <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-dashed border-gray-200 bg-gray-50" style={{ aspectRatio: '1.586' }}>
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
        <line x1="2" y1="10" x2="22" y2="10" strokeWidth="1.5" />
      </svg>
      <p className="text-gray-400 text-xs text-center font-medium">No virtual cards yet</p>
    </div>
  </div>
);

export default function CardsPage() {
  const [activeTab, setActiveTab] = useState('Physical');
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="brand-header text-white sticky top-0 z-10">
        <div className="flex items-center justify-center relative p-4 h-14">
          <button
            onClick={() => router.back()}
            className="absolute left-2 p-2 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">My cards</h1>
        </div>
      </header>

      <div className="flex justify-center px-4 pt-4 pb-2 bg-white sticky top-14 z-10 border-b border-gray-100">
        <div className="flex w-full max-w-xs bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('Physical')}
            className={cn(
              'flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeTab === 'Physical'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'bg-transparent text-gray-500'
            )}
          >
            Physical cards
          </button>
          <button
            onClick={() => setActiveTab('Virtual')}
            className={cn(
              'flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeTab === 'Virtual'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'bg-transparent text-gray-500'
            )}
          >
            Virtual cards
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center gap-6">
        {activeTab === 'Physical' ? (
          <>
            <NedbankCard cardType="physical" />
            <div className="text-center space-y-1 max-w-xs">
              <h2 className="text-base font-semibold text-gray-700">You currently have no active cards.</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Once you have ordered or activated your cards, they will appear here. You will be able to manage limits, block and replace your cards.
              </p>
            </div>
            <Button
              className="w-full max-w-xs h-12 rounded-xl font-semibold text-base"
              style={{ backgroundColor: '#007a33' }}
            >
              Order a new card
            </Button>
          </>
        ) : (
          <>
            <EmptyCard />
            <div className="text-center space-y-1 max-w-xs">
              <h2 className="text-base font-semibold text-gray-700">No virtual cards yet.</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Virtual cards can be used for secure online purchases. Order one to get started.
              </p>
            </div>
            <Button
              className="w-full max-w-xs h-12 rounded-xl font-semibold text-base"
              style={{ backgroundColor: '#007a33' }}
            >
              Order a virtual card
            </Button>
          </>
        )}

        <div className="w-full max-w-xs mt-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
            {[
              { label: 'Card limits', icon: '↕' },
              { label: 'Block / unblock card', icon: '⊘' },
              { label: 'Report lost or stolen', icon: '⚠' },
            ].map(item => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-4 text-sm text-gray-700 hover:bg-gray-100 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span>{item.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
