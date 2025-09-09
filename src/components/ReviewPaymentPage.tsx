'use client';
import { ArrowLeft, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReviewPaymentPage = ({ paymentDetails, fromAccountName, setCurrentView, handlePaymentSubmit }) => {
  const paymentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center w-full flex-shrink-0">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('paymentAmount')} />
        <h1 className="text-xl font-semibold">Review payment</h1>
        <X size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-primary h-16" />
        <div className="p-4 -mt-16">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center">
                <User size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{paymentDetails.bankName.toUpperCase()}</p>
                <p className="text-lg font-semibold">{paymentDetails.recipient}</p>
                <p className="text-sm text-gray-600">{paymentDetails.accountNumber}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <p className="text-gray-400">Payment type</p>
              <p className="text-gray-800 text-base font-medium mt-1">{paymentDetails.paymentMethod}</p>
            </div>
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="text-gray-800 text-base font-medium mt-1">R{parseFloat(paymentDetails.amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</p>
            </div>
            <div>
              <p className="text-gray-400">From account</p>
              <p className="text-gray-800 text-base font-medium mt-1">{fromAccountName.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-400">Payment date</p>
              <p className="text-gray-800 text-base font-medium mt-1">{paymentDate}</p>
            </div>
            <div>
              <p className="text-gray-400">Your reference</p>
              <p className="text-gray-800 text-base font-medium mt-1">{paymentDetails.yourReference}</p>
            </div>
            <div>
              <p className="text-gray-400">Recipient's reference</p>
              <p className="text-gray-800 text-base font-medium mt-1">{paymentDetails.recipientsReference}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t p-4">
        <Button onClick={handlePaymentSubmit} className="w-full text-lg py-6">
          Pay
        </Button>
      </footer>
    </div>
  );
};

export default ReviewPaymentPage;
