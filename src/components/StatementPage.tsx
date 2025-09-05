'use client';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';

const StatementPage = ({ accountName, transactions, balance, setCurrentView, previousView }) => {
    const sortedTransactions = useMemo(() => 
        [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), 
    [transactions]);

    const statementPeriod = useMemo(() => {
        if (sortedTransactions.length === 0) return "N/A";
        const startDate = new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB');
        const endDate = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).toLocaleDateString('en-GB');
        return `${startDate} - ${endDate}`;
    }, [sortedTransactions]);
    
    const calculations = useMemo(() => {
        // First, calculate the balance as it was *before* the first transaction in the list.
        // We do this by starting with the current balance and "reversing" all transactions
        // that occurred *after* the statement period's last transaction.
        // For this app's logic, we assume the passed `balance` is the closing balance for the selected month.
        let openingBalance = balance;
        for (let i = sortedTransactions.length - 1; i >= 0; i--) {
            const tx = sortedTransactions[i];
            const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
            openingBalance -= amount;
        }

        let totalDebits = 0;
        let totalCredits = 0;
        let totalFees = 0;
        
        // Now, create the list of transactions for display, calculating the running balance forward.
        let runningBalance = openingBalance;
        const finalTransactions = sortedTransactions.map(tx => {
            const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
            runningBalance += amount;
            if (amount < 0) {
                totalDebits += Math.abs(amount);
                if (tx.description.toLowerCase().includes('fee:')) {
                    totalFees += Math.abs(amount);
                }
            } else {
                totalCredits += amount;
            }
            return { ...tx, balance: runningBalance };
        });

        const closingBalance = runningBalance;

        // Note: VAT calculation is based on the total fees. VAT = Total Fee * (15 / 115)
        const vatOnFees = totalFees * (15 / 115);

        return {
            openingBalance,
            closingBalance,
            totalCredits,
            totalDebits,
            totalFees,
            vatOnFees,
            finalTransactions,
        };
    }, [sortedTransactions, balance]);


    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '0.00';
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <div className="bg-white min-h-screen font-sans text-xs text-black">
            <header className="bg-gray-100 p-4 flex items-center print:hidden">
                <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView(previousView)} />
                <h1 className="text-lg font-semibold ml-4">Account Statement</h1>
            </header>
            <main className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <Image src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/274c21be47b77228176e072b7bec2a8c.jpg?alt=media&token=5d537a53-0b4d-4d94-9dc7-83536b53fc88" alt="Nedbank Logo" width={100} height={25} />
                            <div className="border-2 border-black p-1 mt-2 text-center text-[10px]">
                                <p className="font-bold">eConfirm</p>
                                <p>{new Date().toLocaleDateString('en-GB')}</p>
                            </div>
                            <div className="mt-4">
                                <p>VAN SCHALKWYK FAMILY TRUST</p>
                                <p>PO BOX 1234</p>
                                <p>SANDTON</p>
                                <p>GAUTENG</p>
                                <p>2196</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00703C"/>
                                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#00703C"/>
                                <path d="M2 7L12 12L22 7L12 2L2 7Z" stroke="#004D2A" strokeWidth="0.5" strokeLinejoin="round"/>
                                <path d="M12 12L2 7V17L12 22V12Z" fill="#005A30"/>
                           </svg>
                           <div className="text-[10px] mt-2">
                                <p>135 Rivonia Road, Sandown, 2196</p>
                                <p>P O Box 1144, Johannesburg, 2000, South Africa</p>
                                <p className="mt-2">Bank VAT Reg No. 4320116074</p>
                                <p>Lost cards 0800 110 929</p>
                                <p>Client services 0860 555 111</p>
                                <p>nedbank.co.za</p>
                           </div>
                        </div>
                    </div>
                    <p className="text-center font-bold text-sm border-t-2 border-b-2 border-black py-1 mb-4">Computer-generated tax invoice</p>

                    {/* Account Summary */}
                    <h3 className="text-sm font-bold bg-gray-200 p-1">Account summary</h3>
                    <div className="bg-[#00703C] text-white p-2 flex justify-between">
                        <p>Account type: <span className="font-bold">{accountName}</span></p>
                        <p>Account number: <span className="font-bold">...{accountName.includes('Savvy') ? '5731' : (accountName.includes('Platinum Cheque') && accountName.includes('2000000') ? '8027' : '4775')}</span></p>
                    </div>
                    <table className="w-full text-[10px] border-separate border-spacing-x-4">
                        <tbody>
                            <tr>
                                <td>Statement date: {new Date().toLocaleDateString('en-GB')}</td>
                                <td>Envelope: 1 of 1</td>
                            </tr>
                            <tr>
                                <td>Statement period: {statementPeriod}</td>
                                <td>Total pages: 1</td>
                            </tr>
                             <tr>
                                <td>Statement frequency: Monthly</td>
                                <td>Client VAT number:</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Bank Charges & Cashflow */}
                    <div className="grid grid-cols-2 gap-6 mt-4 border-t border-b border-black py-2">
                        <div>
                            <h3 className="text-sm font-bold mb-2">Bank charges summary</h3>
                             <table className="w-full text-[10px]">
                                <tbody>
                                    <tr>
                                        <td>Electronic banking fees</td><td className="text-right">R{formatCurrency(calculations.totalFees)}</td>
                                    </tr>
                                    <tr>
                                        <td>Initiation fee</td><td className="text-right">R0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Transaction service fees</td><td className="text-right">R0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Other charges</td><td className="text-right">R0.00</td>
                                    </tr>
                                    <tr className="border-t border-black font-bold">
                                        <td>Bank charge(s) (total)</td><td className="text-right">R{formatCurrency(calculations.totalFees)}</td>
                                    </tr>
                                     <tr>
                                        <td>*VAT inclusive @</td><td className="text-right">15.000%</td>
                                    </tr>
                                     <tr>
                                        <td>VAT calculated monthly</td><td className="text-right">R{formatCurrency(calculations.vatOnFees)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                             <h3 className="text-sm font-bold mb-2">Cashflow</h3>
                            <table className="w-full text-[10px]">
                                <tbody>
                                    <tr>
                                        <td>Opening balance</td><td className="text-right">R{formatCurrency(calculations.openingBalance)}</td>
                                    </tr>
                                    <tr>
                                        <td>Funds received/Credits</td><td className="text-right">R{formatCurrency(calculations.totalCredits)}</td>
                                    </tr>
                                    <tr>
                                        <td>Funds used/Debits</td><td className="text-right">R{formatCurrency(calculations.totalDebits)}</td>
                                    </tr>
                                    <tr className="border-t border-black font-bold">
                                        <td>Closing balance</td><td className="text-right">R{formatCurrency(calculations.closingBalance)}</td>
                                    </tr>
                                     <tr>
                                        <td>Annual credit interest rate</td><td className="text-right">0.000%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Transactions Table */}
                    <div className="mt-4">
                        <table className="w-full text-[10px]">
                            <thead className="bg-[#00703C] text-white">
                                <tr>
                                    <th className="text-left p-1 font-normal">Date</th>
                                    <th className="text-left p-1 font-normal">Description</th>
                                    <th className="text-right p-1 font-normal">Debits(R)</th>
                                    <th className="text-right p-1 font-normal">Credits(R)</th>
                                    <th className="text-right p-1 font-normal">Balance(R)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b bg-gray-100 font-bold">
                                    <td className="p-1">{calculations.finalTransactions.length > 0 ? new Date(calculations.finalTransactions[0].timestamp).toLocaleDateString('en-GB') : '-'}</td>
                                    <td className="p-1">Opening balance</td>
                                    <td></td><td></td>
                                    <td className="text-right p-1">{formatCurrency(calculations.openingBalance)}</td>
                                </tr>
                                {calculations.finalTransactions.map((tx, index) => {
                                    const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
                                    const isDebit = amount < 0;
                                    return (
                                        <tr key={tx.id || index} className="border-b bg-gray-100">
                                            <td className="p-1">{new Date(tx.timestamp).toLocaleDateString('en-GB')}</td>
                                            <td className="p-1">{tx.description}</td>
                                            <td className="text-right p-1">{isDebit ? formatCurrency(Math.abs(amount)) : ''}</td>
                                            <td className="text-right p-1">{!isDebit ? formatCurrency(amount) : ''}</td>
                                            <td className="text-right p-1">{formatCurrency(tx.balance)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="font-bold text-lg text-green-700">seemoneydifferently</p>
                        <div className="flex justify-end mt-2">
                             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00703C"/>
                                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#00703C"/>
                                <path d="M2 7L12 12L22 7L12 2L2 7Z" stroke="#004D2A" strokeWidth="0.5" strokeLinejoin="round"/>
                                <path d="M12 12L2 7V17L12 22V12Z" fill="#005A30"/>
                           </svg>
                        </div>
                        <p className="text-[9px] text-gray-600 mt-2">
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
