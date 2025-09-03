'use client';
import { ArrowLeft, MessageSquare, ChevronRight, Search, Sliders } from 'lucide-react';

const TransactionsPage = ({ accountName, currentBalance, transactionsList, backView, setCurrentView, handleTransactionClick }) => {
  const groupedTransactions = transactionsList.reduce((acc, transaction) => {
    const date = new Date(transaction.timestamp);
    if (isNaN(date.getTime())) return acc;
    const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(transaction);
    return acc;
  }, {});

  const menuItems = ['Transactions', 'Debit orders', 'Scheduled', 'Card management', 'Details', 'Features'];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div>
        <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center w-full">
          <div className="flex items-center space-x-4">
            <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView(backView || 'overview')} />
            <div className="flex flex-col">
              <span className="text-xl font-semibold tracking-wider">CURRENT</span>
              <span className="text-sm font-light text-primary-foreground">1351056866</span>
            </div>
          </div>
          <MessageSquare size={24} />
        </header>
        <div className="bg-primary text-primary-foreground p-4 flex justify-between text-left w-full space-x-4">
          <div className="flex-1">
            <p className="text-xs text-primary-foreground font-light">Current balance</p>
            <p className="text-xl font-normal">R{currentBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-primary-foreground font-light">Available balance</p>
            <p className="text-xl font-normal">R{currentBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</p>
          </div>
        </div>
        <div className="bg-white border-b border-gray-300 overflow-x-auto whitespace-nowrap">
          <div className="flex px-4 space-x-6 text-sm">
            {menuItems.map((item, index) => (
              <span key={item} className={`py-3 ${index === 0 ? 'text-primary font-semibold border-b-2 border-primary' : 'text-gray-500'}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4 bg-gray-100">
          <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center cursor-pointer" onClick={() => setCurrentView('failedTransactions')}>
            <span className="text-sm">Failed transactions</span><ChevronRight size={16} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center cursor-pointer">
            <span className="text-sm">Once-off payments</span><ChevronRight size={16} />
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-primary">Filter</span><Sliders size={18} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-100 pb-20">
        <div className="px-4">
          {Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a)).map((monthYear) => (
            <div key={monthYear} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">{monthYear.toUpperCase()}</h3>
              {groupedTransactions[monthYear].map((transaction, index) => (
                <div key={transaction.id || index} onClick={() => handleTransactionClick(transaction)} className="flex justify-between items-center p-4 border-b border-gray-200 bg-white cursor-pointer">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-sm font-bold text-gray-900">{transaction.description}</p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${transaction.amount.startsWith('-') ? 'text-gray-900' : 'text-green-600'}`}>{transaction.amount}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
