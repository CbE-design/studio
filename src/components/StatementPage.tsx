'use client';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const StatementPage = ({ accountName, transactions, balance, setCurrentView, previousView }) => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const transactionsWithBalance = [];
    let runningBalance = balance;

    // Calculate historical balances by reversing transactions from the current balance
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        transactionsWithBalance.unshift({ ...tx, balance: runningBalance });
        runningBalance -= amount;
    }

    const openingBalance = runningBalance;
    
    // Now, recalculate forward to ensure correctness
    let currentRunningBalance = openingBalance;
    const finalTransactions = transactionsWithBalance.map(tx => {
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        currentRunningBalance += amount;
        return { ...tx, balance: currentRunningBalance };
    });

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '0.00';
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return (
        <div className="bg-white min-h-screen font-sans">
            <header className="bg-gray-100 p-4 flex items-center print:hidden">
                <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView(previousView)} />
                <h1 className="text-lg font-semibold ml-4">Account Statement</h1>
            </header>
            <main className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <Image src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/274c21be47b77228176e072b7bec2a8c.jpg?alt=media&token=5d537a53-0b4d-4d94-9dc7-83536b53fc88" alt="Nedbank Logo" width={120} height={30} />
                            <div className="border-2 border-black p-2 mt-4 text-center">
                                <p className="font-bold">eConfirm</p>
                                <p className="text-sm">{new Date().toLocaleDateString('en-GB')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00703C"/>
                                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#00703C"/>
                                <path d="M2 7L12 12L22 7L12 2L2 7Z" stroke="#004D2A" strokeWidth="0.5" strokeLinejoin="round"/>
                                <path d="M12 12L2 7V17L12 22V12Z" fill="#005A30"/>
                           </svg>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold mb-4">Bank charges for the period 12 February 2021 to 12 May 2021</h2>

                    {/* Bank Charges Table */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead className="bg-[#00703C] text-white">
                                <tr>
                                    <th className="text-left p-2 font-normal">NarrativeDescription</th>
                                    <th className="text-right p-2 font-normal">Itemcost(R)</th>
                                    <th className="text-right p-2 font-normal">VAT(R)</th>
                                    <th className="text-right p-2 font-normal">Total(R)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b"><td className="p-2">Electronic banking fees</td><td className="text-right p-2">7.48</td><td className="text-right p-2">1.12</td><td className="text-right p-2">8.60</td></tr>
                                <tr className="border-b"><td className="p-2">Initiation fee</td><td className="text-right p-2">43.48</td><td className="text-right p-2">6.52</td><td className="text-right p-2">50.00</td></tr>
                                <tr className="border-b"><td className="p-2">Transaction service fees</td><td className="text-right p-2">51.30</td><td className="text-right p-2">7.70</td><td className="text-right p-2">59.00</td></tr>
                                <tr className="border-b"><td className="p-2">Other charges</td><td className="text-right p-2">88.70</td><td className="text-right p-2">13.30</td><td className="text-right p-2">102.00</td></tr>
                                <tr className="font-bold"><td className="p-2">TotalCharges</td><td></td><td></td><td className="text-right p-2">219.60</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Transactions Table */}
                    <div>
                        <table className="w-full text-sm">
                            <thead className="bg-[#00703C] text-white">
                                <tr>
                                    <th className="text-left p-2 font-normal">Tranlistno</th>
                                    <th className="text-left p-2 font-normal">Date</th>
                                    <th className="text-left p-2 font-normal">Description</th>
                                    <th className="text-right p-2 font-normal">Fees(R)</th>
                                    <th className="text-right p-2 font-normal">Debits(R)</th>
                                    <th className="text-right p-2 font-normal">Credits(R)</th>
                                    <th className="text-right p-2 font-normal">Balance(R)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b bg-gray-100">
                                    <td></td>
                                    <td className="p-2">{finalTransactions.length > 0 ? new Date(finalTransactions[0].timestamp).toLocaleDateString('en-GB') : '-'}</td>
                                    <td className="p-2">Openingbalance</td>
                                    <td></td><td></td><td></td>
                                    <td className="text-right p-2">{formatCurrency(openingBalance)}</td>
                                </tr>
                                {finalTransactions.map((tx, index) => {
                                    const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
                                    const isDebit = amount < 0;
                                    return (
                                        <tr key={tx.id || index} className="border-b bg-gray-100">
                                            <td className="p-2"></td>
                                            <td className="p-2">{new Date(tx.timestamp).toLocaleDateString('en-GB')}</td>
                                            <td className="p-2">{tx.description}</td>
                                            <td className="text-right p-2"></td>
                                            <td className="text-right p-2">{isDebit ? formatCurrency(Math.abs(amount)) : ''}</td>
                                            <td className="text-right p-2">{!isDebit ? formatCurrency(amount) : ''}</td>
                                            <td className="text-right p-2">{formatCurrency(tx.balance)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="font-bold text-lg text-green-700">seemoneydifferently</p>
                        <div className="flex justify-end mt-4">
                             <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00703C"/>
                                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#00703C"/>
                                <path d="M2 7L12 12L22 7L12 2L2 7Z" stroke="#004D2A" strokeWidth="0.5" strokeLinejoin="round"/>
                                <path d="M12 12L2 7V17L12 22V12Z" fill="#005A30"/>
                           </svg>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution
                            <br/>
                            through the Ombudsman for Banking Services. Authorised financial services and registered credit provider (NCRCP16).
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StatementPage;
