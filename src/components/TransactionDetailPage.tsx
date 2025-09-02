'use client';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const TransactionDetailPage = ({ selectedTransaction, setCurrentView }) => {
  if (!selectedTransaction) return null; // Or some fallback UI

  const isDebit = selectedTransaction.amount.startsWith('-');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="bg-white p-4 flex justify-between items-center w-full shadow-md">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('transactions')} />
        <span className="text-lg font-semibold">Transaction details</span>
        <MessageSquare size={24} />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md mx-auto">
          <div className="text-center mb-6 pb-4 border-b">
            <p className={`text-3xl font-bold ${isDebit ? 'text-gray-900' : 'text-green-600'}`}>
              {selectedTransaction.amount.replace(/([+-])/, '$1 ')}
            </p>
            <p className="text-lg font-semibold mt-2">{selectedTransaction.description}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">Successful</p>
          </div>
          <div className="space-y-4 text-left text-sm">
            <h3 className="font-bold text-gray-800">Details</h3>
            <div className="flex justify-between">
              <p className="text-gray-500">Transaction date</p>
              <p className="font-medium">{new Date(selectedTransaction.timestamp).toLocaleString('en-ZA', { dateStyle: 'long' })}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Transaction type</p>
              <p className="font-medium">{isDebit ? 'Payment' : 'Deposit'}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Reference</p>
              <p className="font-medium">{selectedTransaction.description}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransactionDetailPage;
