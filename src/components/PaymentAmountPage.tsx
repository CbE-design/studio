'use client';
import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentAmountPage = ({ paymentDetails, setPaymentDetails, handlePaymentSubmit, setCurrentView, accounts }) => {
  const isFormValid = paymentDetails.amount && parseFloat(paymentDetails.amount) > 0;
  
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setPaymentDetails({ ...paymentDetails, amount: value });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Header Section */}
      <header className="bg-primary text-primary-foreground p-4 flex flex-col items-start flex-shrink-0">
        <div className="flex justify-between w-full items-center mb-4">
          <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('payment')} />
          <h1 className="text-xl font-semibold">Pay {paymentDetails.recipient}</h1>
          <X size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
        </div>
        <p className="text-sm">{paymentDetails.bankName}</p>
        <p className="text-sm mb-4">{paymentDetails.accountNumber}</p>
        
        <label htmlFor="amount" className="text-sm font-light">Amount</label>
        <div className="w-full text-4xl font-light border-b border-primary-foreground/50 py-2">
            <span className="opacity-50 mr-1">R</span>
            <input
              type="text"
              id="amount"
              value={paymentDetails.amount}
              onChange={handleAmountChange}
              className="bg-transparent outline-none w-auto"
              placeholder="0.00"
              autoFocus
            />
        </div>
        <p className="text-xs mt-2 opacity-80">R10 000.00 daily payment limit remaining</p>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Content can be added here if needed, like account selection etc. */}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10 max-w-lg mx-auto">
        <Button 
          onClick={handlePaymentSubmit} 
          disabled={!isFormValid}
          className="w-full text-lg py-6"
        >
          Pay
        </Button>
      </footer>
    </div>
  );
};

export default PaymentAmountPage;
