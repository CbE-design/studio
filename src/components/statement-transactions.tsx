
'use client';

import type { Account, Transaction } from '@/app/lib/definitions';
import { format } from 'date-fns';

const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const StatementTransactionsPage = ({ account, transactions, openingBalance }: { account: Account, transactions: Transaction[], openingBalance: number }) => {
    
    let runningBalance = openingBalance;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <div className="flex justify-between items-center pb-4 border-b">
                 <div className="text-left">
                    <h2 className="text-xl font-bold">{account.name} - Transactions</h2>
                    <p className="text-gray-600">{account.accountNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Page 2 of 2</p>
                </div>
            </div>
            
            <div className="mt-6">
                <table className="w-full text-sm text-left">
                    <thead className="bg-primary/90 text-white">
                        <tr>
                            <th className="p-2 font-semibold">Date</th>
                            <th className="p-2 font-semibold">Description</th>
                            <th className="p-2 font-semibold text-right">Debits({account.currency})</th>
                            <th className="p-2 font-semibold text-right">Credits({account.currency})</th>
                            <th className="p-2 font-semibold text-right">Balance({account.currency})</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr className="border-b">
                            <td className="p-2">{transactions.length > 0 ? format(new Date(transactions[0]?.date || new Date()), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</td>
                            <td className="p-2 font-semibold">Opening Balance</td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right font-medium">{formatCurrency(openingBalance)}</td>
                        </tr>
                        {transactions.map((tx) => {
                             runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
                             return (
                                <tr key={tx.id} className="border-b last:border-0">
                                    <td className="p-2">{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                                    <td className="p-2">{tx.recipientName?.toUpperCase() || tx.description}</td>
                                    <td className="p-2 text-right text-red-600">
                                        {tx.type === 'debit' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="p-2 text-right text-green-600">
                                        {tx.type === 'credit' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(runningBalance)}</td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

