'use client';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const StatementAccountPage = ({ accounts, setCurrentView, setStatementAccount }) => {
  
  const handleAccountSelect = (account) => {
    setStatementAccount(account);
    setCurrentView('statementMonth');
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white text-gray-800 p-4 flex items-center w-full shadow-md">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
        <h1 className="text-xl font-semibold ml-4">Select an Account</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        {accounts.map((account) => (
          <div key={account.id} onClick={() => handleAccountSelect(account)} className="flex items-center p-4 border-b cursor-pointer">
            <div className="ml-4 flex-1">
              <p className="font-semibold">{account.name}</p>
              <p className="text-sm text-gray-500">Balance: R{account.balance.toFixed(2)}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        ))}
      </main>
    </div>
  );
};

export default StatementAccountPage;
