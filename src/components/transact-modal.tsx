'use client';

import { X, ArrowRightLeft, Receipt, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TransactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactModal({ isOpen, onClose }: TransactModalProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const handleTransferClick = () => {
    router.push('/transfer');
    onClose();
  }

  const handlePayClick = () => {
    router.push('/pay');
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-end"
      onClick={onClose}
    >
      <div 
        className="relative w-full h-1/3"
        onClick={e => e.stopPropagation()}
      >
        {/* Action Buttons */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs flex justify-center items-end">
          {/* Transfer Button */}
          <div className="flex flex-col items-center absolute -translate-x-[9rem]">
            <button 
              onClick={handleTransferClick}
              className="bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg text-gray-700">
              <ArrowRightLeft className="h-10 w-10" />
            </button>
            <span className="mt-2 text-white font-medium">Transfer</span>
          </div>

          {/* Pay Button */}
          <div className="flex flex-col items-center relative -top-16">
            <button 
             onClick={handlePayClick}
             className="bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg text-gray-700">
              <CreditCard className="h-10 w-10" />
            </button>
            <span className="mt-2 text-white font-medium">Pay</span>
          </div>
          
          {/* Buy Button */}
          <div className="flex flex-col items-center absolute translate-x-[9rem]">
            <button className="bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg text-ray-700">
              <Receipt className="h-10 w-10" />
            </button>
            <span className="mt-2 text-white font-medium">Buy</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-12 w-12 text-white"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
