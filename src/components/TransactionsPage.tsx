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
  
  const formatAmount = (amountStr) => {
    if (amountStr.startsWith('+')) {
      return amountStr.substring(1);
    }
    return amountStr;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Static Header and Controls */}
      <div className="flex-shrink-0">
        <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center w-full">
          <div className="flex items-center space-x-4">
            <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView(backView || 'overview')} />
            <div className="flex flex-col">
              <span className="text-lg font-light">{accountName}</span>
              <p className="text-sm font-normal">R{currentBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</p>
            </div>
          </div>
          <MessageSquare size={24} />
        </header>
        <div className="bg-white border-b border-gray-300 overflow-x-auto whitespace-nowrap">
          <div className="flex px-4 space-x-6 text-sm">
            {menuItems.map((item, index) => (
              <span key={item} className={`py-3 ${index === 0 ? 'text-black font-semibold border-b-2 border-primary' : 'text-gray-500'}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3 bg-gray-100">
          <div 
            className="bg-white p-5 rounded-xl shadow-md flex justify-between items-center cursor-pointer" 
            onClick={() => setCurrentView('failedTransactions')}
          >
            <span className="text-base">Failed transactions</span>
            <ChevronRight size={20} />
          </div>
          <div 
            className="bg-white p-5 rounded-xl shadow-md flex justify-between items-center cursor-pointer" 
            onClick={() => setCurrentView('payment')}
          >
            <span className="text-base">Once-off payment</span>
            <ChevronRight size={20} />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 text-base" 
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-primary">Filter</span>
              <Sliders size={18} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Transaction History */}
      <div className="flex-1 overflow-y-auto bg-white pb-20">
        <div>
          {Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a)).map((monthYear) => (
            <div key={monthYear}>
              <h3 className="text-sm font-bold text-gray-800 bg-gray-100 p-4 sticky top-0">{monthYear.toUpperCase()}</h3>
              <div className="px-4">
                {groupedTransactions[monthYear].map((transaction, index) => (
                  <div 
                    key={transaction.id || index} 
                    onClick={() => handleTransactionClick(transaction)} 
                    className="flex justify-between items-center py-4 border-b border-gray-200 bg-white cursor-pointer last:border-b-0"
                  >
                    <div>
                      <p className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-sm font-medium text-gray-900 uppercase mt-1">{transaction.description}</p>
                    </div>
                    <p className={`text-sm font-normal tabular-nums ${transaction.amount.startsWith('-') ? 'text-gray-800' : 'text-green-600'}`}>
                      {formatAmount(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
