'use client';
import { useRef } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AccountCard = ({ account, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-lg border-2 w-48 flex-shrink-0 cursor-pointer relative overflow-hidden",
                isSelected ? 'border-[#009650]' : 'border-gray-300'
            )}
        >
            <div className="bg-white p-4 text-center h-28 flex flex-col justify-center relative">
                <p className="font-bold text-lg text-[#009650]">{account.name.split(' ')[0].toUpperCase()}</p>
                <p className="text-sm text-[#009650]">{account.name.replace(account.name.split(' ')[0], '')}</p>
                <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: '12px solid transparent',
                        borderRight: '12px solid transparent',
                        borderTop: '12px solid white',
                    }}
                />
            </div>
            <div className={cn("p-4 text-center h-20 flex items-center justify-center bg-[#009650] text-white")}>
                <p className="font-bold text-lg">{`R${account.balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`}</p>
            </div>
        </div>
    );
};

const PaymentAmountPage = ({ paymentDetails, setPaymentDetails, handlePaymentSubmit, setCurrentView, accounts }) => {
  const isFormValid = paymentDetails.amount && parseFloat(paymentDetails.amount) > 0 && paymentDetails.yourReference;

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setPaymentDetails({ ...paymentDetails, amount: value });
    }
  };

  const handleAccountSelect = (accountId: string) => {
    setPaymentDetails(prev => ({ ...prev, fromAccount: accountId }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header Section */}
      <header 
        className="bg-primary text-primary-foreground p-4 flex flex-col items-center flex-shrink-0 w-full z-10"
      >
        <div className="flex justify-between w-full items-center mb-2">
          <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('payment')} />
          <h1 className="text-xl font-semibold">Pay {paymentDetails.recipient}</h1>
          <X size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
        </div>
        <p className="text-sm">{paymentDetails.bankName}</p>
        <p className="text-sm mb-2">{paymentDetails.accountNumber}</p>
        
        <label htmlFor="amount" className="text-sm font-light">Amount</label>
        <div className="w-full text-4xl font-light border-b border-primary-foreground/50 py-2 text-center">
            <input
              type="text"
              id="amount"
              value={paymentDetails.amount}
              onChange={handleAmountChange}
              className="bg-transparent outline-none w-auto text-center"
              placeholder="0.00"
              autoFocus
            />
        </div>
        <p className="text-xs mt-2 opacity-80">R10 000.00 daily payment limit remaining</p>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto bg-white overflow-hidden">
        <div className="p-4">
            <h2 className="text-gray-500 mb-2 font-medium">From which account?</h2>
            
            <div className="flex overflow-x-auto space-x-4 py-2">
                {accounts.map((account) => (
                    <AccountCard 
                        key={account.id}
                        account={account}
                        isSelected={paymentDetails.fromAccount === account.id}
                        onClick={() => handleAccountSelect(account.id)}
                    />
                ))}
            </div>

            <div className="mt-6">
                 <h2 className="text-gray-500 mb-4 font-medium">What is the payment for?</h2>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="yourReference" className="text-sm text-gray-500">Your reference</label>
                        <Input 
                            id="yourReference"
                            value={paymentDetails.yourReference}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, yourReference: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="recipientsReference" className="text-sm text-gray-500">Recipient's reference</label>
                         <Input 
                            id="recipientsReference"
                            value={paymentDetails.recipientsReference}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, recipientsReference: e.target.value })}
                        />
                    </div>
                 </div>
            </div>

            <div className="mt-6">
                <h2 className="text-gray-500 mb-2 font-medium">Notifications ({paymentDetails.sendSms ? 1 : 0}/1)</h2>
                <div 
                    onClick={() => setPaymentDetails(prev => ({ ...prev, sendSms: !prev.sendSms }))}
                    className="flex items-center space-x-3 text-primary font-medium cursor-pointer"
                >
                    <PlusCircle size={24} />
                    <span>Add a notification</span>
                </div>
                {paymentDetails.sendSms && (
                    <div className="mt-4">
                        <label htmlFor="recipientPhone" className="text-sm text-gray-500">Recipient's cellphone number for SMS</label>
                        <Input 
                            id="recipientPhone"
                            type="tel"
                            placeholder="+27000000000"
                            value={paymentDetails.recipientPhone}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, recipientPhone: e.target.value })}
                        />
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="bg-white border-t p-4 z-10">
        <Button 
          onClick={handlePaymentSubmit} 
          disabled={!isFormValid}
          className="w-full text-lg py-6"
        >
          Next
        </Button>
      </footer>
    </div>
  );
};

export default PaymentAmountPage;
