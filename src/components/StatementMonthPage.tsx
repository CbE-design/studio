'use client';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

const StatementMonthPage = ({ account, setCurrentView, onMonthSelect }) => {

    const groupedTransactionsByMonth = useMemo(() => {
        return account.transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.timestamp);
            if (isNaN(date.getTime())) return acc;
            const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(transaction);
            return acc;
        }, {});
    }, [account.transactions]);

    const handleMonthSelect = (monthYear) => {
        const monthTransactions = groupedTransactionsByMonth[monthYear];

        // This is a simplified balance calculation for the end of the selected month.
        // A more accurate approach would track running balance from the beginning.
        let endOfMonthBalance = account.balance;
        const allLaterTransactions = account.transactions.filter(tx => {
            const txDate = new Date(tx.timestamp);
            const selectedMonthDate = new Date(monthYear);
            return txDate.getFullYear() > selectedMonthDate.getFullYear() || 
                   (txDate.getFullYear() === selectedMonthDate.getFullYear() && txDate.getMonth() > selectedMonthDate.getMonth());
        });
        
        allLaterTransactions.forEach(tx => {
            const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
            endOfMonthBalance -= amount;
        });

        onMonthSelect(monthTransactions, endOfMonthBalance);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="bg-white text-gray-800 p-4 flex items-center w-full shadow-md">
                <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('statementAccount')} />
                <h1 className="text-xl font-semibold ml-4">Select a Month for {account.name}</h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                {Object.keys(groupedTransactionsByMonth).sort((a, b) => new Date(b) - new Date(a)).map((monthYear) => (
                    <div key={monthYear} onClick={() => handleMonthSelect(monthYear)} className="flex items-center p-4 border-b cursor-pointer">
                        <div className="ml-4 flex-1">
                            <p className="font-semibold">{monthYear}</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                ))}
            </main>
        </div>
    );
};

export default StatementMonthPage;
