'use client';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const FailedTransactionsPage = ({ failedTransactionsData, setCurrentView }) => (
  <div className="flex flex-col h-screen overflow-hidden">
    <header className="bg-[#00703C] text-white p-4 flex justify-between items-center w-full">
      <div className="flex items-center space-x-4">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('transactions')} />
        <span className="text-lg font-semibold">Failed Transactions</span>
      </div>
      <MessageSquare size={24} />
    </header>
    <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
      <div className="bg-white p-4 rounded-xl shadow-md space-y-6">
        {failedTransactionsData.map((transaction, index) => (
          <div key={index} className="flex flex-col space-y-4 border-b pb-4 last:border-b-0">
            <h3 className="text-lg font-bold text-red-600">FAILED PAYMENT</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Type</p><p className="font-medium">{transaction.type}</p></div>
              <div><p className="text-gray-500">Recipient</p><p className="font-medium">{transaction.recipient}</p></div>
              <div><p className="text-gray-500">Recipient Details</p><p className="font-medium">{transaction.recipientDetails}</p></div>
              <div><p className="text-gray-500">Payer Account</p><p className="font-medium">{transaction.payerAccount}</p></div>
              <div><p className="text-gray-500">Amount</p><p className="font-bold text-lg text-red-600">{transaction.amount}</p></div>
              <div><p className="text-gray-500">Date</p><p className="font-medium">{transaction.date.toLocaleDateString()}</p></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

export default FailedTransactionsPage;
