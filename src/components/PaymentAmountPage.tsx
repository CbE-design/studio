'use client';
import { useState } from 'react';
import { ArrowLeft, X, PlusCircle } from 'lucide-react';
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

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '0.00';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
        <form onSubmit={handlePaymentSubmit} className="p-4 space-y-6">
          <div>
            <h2 className="text-gray-600 font-semibold mb-2">From which account?</h2>
            <div className="flex space-x-4 overflow-x-auto pb-2">
                {accounts.map(account => (
                    <div 
                        key={account.id} 
                        onClick={() => setPaymentDetails({...paymentDetails, fromAccount: account.id === 'savvy' ? 'current' : (account.id === 'platinum1' ? 'second' : 'third')})}
                        className={`p-4 rounded-lg border-2 min-w-[160px] cursor-pointer ${paymentDetails.fromAccount === (account.id === 'savvy' ? 'current' : (account.id === 'platinum1' ? 'second' : 'third')) ? 'border-primary' : 'border-gray-300'}`}
                    >
                        <p className="font-bold text-primary">{account.name.split(' ')[0].toUpperCase()}</p>
                        <p className="text-sm text-gray-500">{account.name}</p>
                        <div className={`mt-4 pt-2 border-t-2 ${paymentDetails.fromAccount === (account.id === 'savvy' ? 'current' : (account.id === 'platinum1' ? 'second' : 'third')) ? 'border-primary' : 'border-gray-300'}`}>
                           <p className="font-semibold">R{formatCurrency(account.balance)}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-gray-600 font-semibold mb-2">What is the payment for?</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                value={paymentDetails.yourReference}
                onChange={(e) => setPaymentDetails({...paymentDetails, yourReference: e.target.value})}
                placeholder="Your reference"
                className="w-full p-3 border border-gray-300 rounded-md" 
              />
              <input 
                type="text" 
                value={paymentDetails.recipientsReference}
                onChange={(e) => setPaymentDetails({...paymentDetails, recipientsReference: e.target.value})}
                placeholder="Recipient's reference"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <h2 className="text-gray-600 font-semibold mb-2">Notifications (0/1)</h2>
             <button type="button" className="flex items-center space-x-2 text-primary">
                <PlusCircle size={20} />
                <span>Add a notification</span>
            </button>
          </div>
        </form>
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
