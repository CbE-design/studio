'use client';

import { X, ArrowRightLeft, Receipt, CreditCard } from 'lucide-react';

interface TransactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactModal({ isOpen, onClose }: TransactModalProps) {
  if (!isOpen) return null;

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
          <div className="flex flex-col items-center absolute -translate-x-[7rem]">
            <button className="bg-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg text-gray-700">
              <ArrowRightLeft className="h-8 w-8" />
            </button>
            <span className="mt-2 text-white font-medium">Transfer</span>
          </div>

          {/* Pay Button */}
          <div className="flex flex-col items-center relative -top-8">
            <button className="bg-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg text-gray-700">
              <CreditCard className="h-8 w-8" />
            </button>
            <span className="mt-2 text-white font-medium">Pay</span>
          </div>
          
          {/* Buy Button */}
          <div className="flex flex-col items-center absolute translate-x-[7rem]">
            <button className="bg-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg text-gray-700">
              <Receipt className="h-8 w-8" />
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
