'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TransactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransferIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const PayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const BuyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export function TransactModal({ isOpen, onClose }: TransactModalProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const options = [
    { label: 'Transfer', icon: <TransferIcon />, href: '/transfer' },
    { label: 'Pay', icon: <PayIcon />, href: '/pay' },
    { label: 'Buy', icon: <BuyIcon />, href: '/buy' },
  ];

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center items-end gap-10 mb-8 px-8">
          {options.map((option, i) => (
            <div
              key={option.label}
              className="flex flex-col items-center gap-3"
              style={{
                transform: i === 1 ? 'translateY(-24px)' : 'translateY(0)',
              }}
            >
              <button
                onClick={() => handleNav(option.href)}
                className="flex items-center justify-center rounded-full bg-white shadow-xl active:scale-95 transition-transform"
                style={{ width: 60, height: 60 }}
              >
                <span className="text-gray-700">{option.icon}</span>
              </button>
              <span className="text-white text-sm font-medium">{option.label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full bg-white/20"
            style={{ width: 52, height: 52 }}
          >
            <X className="h-6 w-6 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
