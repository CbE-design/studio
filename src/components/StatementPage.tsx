'use client';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { generateStatementPdf } from '@/ai/flows/generate-statement-pdf';


const StatementPage = ({ accountName, transactions, balance, setCurrentView, previousView }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const { pdfBase64 } = await generateStatementPdf({
                accountName,
                transactions,
                balance,
            });

            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${pdfBase64}`;
            link.download = 'AccountStatement.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate or download statement PDF:", error);
            alert("Sorry, we couldn't generate the statement PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const sortedTransactions = useMemo(() => 
        [...transactions].sort((a, b) => new Date(a.timestamp) - b.timestamp), 
    [transactions]);

    const statementPeriod = useMemo(() => {
        if (sortedTransactions.length === 0) return "N/A";
        const startDate = new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const endDate = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        return `${startDate} to ${endDate}`;
    }, [sortedTransactions]);
    
    const calculations = useMemo(() => {
        let openingBalance = balance;
        for (let i = sortedTransactions.length - 1; i >= 0; i--) {
            const tx = sortedTransactions[i];
            const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
            openingBalance -= amount;
        }

        let totalFees = 0;
        
        let runningBalance = openingBalance;
        const finalTransactions = sortedTransactions.map(tx => {
            const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
            runningBalance += amount;
            if (tx.description.toLowerCase().includes('fee:')) {
                totalFees += Math.abs(amount);
            }
            return { ...tx, balance: runningBalance, amount: amount };
        });

        const vatOnFees = totalFees * (15 / 115);
        const itemCostFees = totalFees - vatOnFees;

        return {
            openingBalance,
            totalFees,
            vatOnFees,
            itemCostFees,
            finalTransactions,
        };
    }, [sortedTransactions, balance]);


    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '0.00';
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <div className="bg-white min-h-screen font-sans text-sm text-gray-800">
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 border-b">
                <div className="flex items-center">
                    <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView(previousView)} />
                    <h1 className="text-lg font-semibold ml-4">Account Statement</h1>
                </div>
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={isDownloading}
                  className="flex items-center bg-primary text-primary-foreground py-2 px-4 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
            </header>
            <main className="p-4">
                <div className="border rounded-lg p-2 mb-4 w-28">
                    <p className="font-bold text-center">eConfirm</p>
                    <p className="text-xs text-center">{new Date().toLocaleDateString('en-GB')}</p>
                </div>

                <h2 className="font-bold mb-2">Bank charges for the period {statementPeriod}</h2>
                
                {/* Bank Charges Table */}
                <div className="overflow-x-auto mb-8">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#00703C] text-white">
                            <tr>
                                <th className="p-2 font-semibold">NarrativeDescription</th>
                                <th className="p-2 font-semibold text-right">Itemcost(R)</th>
                                <th className="p-2 font-semibold text-right">VAT(R)</th>
                                <th className="p-2 font-semibold text-right">Total(R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2">Electronic banking fees</td>
                                <td className="p-2 text-right">{formatCurrency(calculations.itemCostFees)}</td>
                                <td className="p-2 text-right">{formatCurrency(calculations.vatOnFees)}</td>
                                <td className="p-2 text-right">{formatCurrency(calculations.totalFees)}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-2">Initiation fee</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                            </tr>
                             <tr className="border-b">
                                <td className="p-2">Transaction service fees</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-2">Other charges</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                                <td className="p-2 text-right">0.00</td>
                            </tr>
                            <tr className="font-bold">
                                <td className="p-2">TotalCharges</td>
                                <td className="p-2 text-right" colSpan={2}></td>
                                <td className="p-2 text-right">{formatCurrency(calculations.totalFees)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#00703C] text-white">
                            <tr>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold">Description</th>
                                <th className="p-2 font-semibold text-right">Fees(R)</th>
                                <th className="p-2 font-semibold text-right">Debits(R)</th>
                                <th className="p-2 font-semibold text-right">Credits(R)</th>
                                <th className="p-2 font-semibold text-right">Balance(R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b font-bold">
                                <td className="p-2">{calculations.finalTransactions.length > 0 ? new Date(calculations.finalTransactions[0].timestamp).toLocaleDateString('en-GB') : '-'}</td>
                                <td className="p-2">Openingbalance</td>
                                <td className="p-2 text-right"></td>
                                <td className="p-2 text-right"></td>
                                <td className="p-2 text-right"></td>
                                <td className="p-2 text-right">{formatCurrency(calculations.openingBalance)}</td>
                            </tr>
                            {calculations.finalTransactions.map((tx, index) => {
                                const isFee = tx.description.toLowerCase().includes('fee:');
                                return (
                                    <tr key={tx.id || index} className="border-b">
                                        <td className="p-2">{new Date(tx.timestamp).toLocaleDateString('en-GB')}</td>
                                        <td className="p-2">{tx.description}</td>
                                        <td className="p-2 text-right">{isFee ? formatCurrency(Math.abs(tx.amount)) : ''}</td>
                                        <td className="p-2 text-right">{!isFee && tx.amount < 0 ? formatCurrency(Math.abs(tx.amount)) : ''}</td>
                                        <td className="p-2 text-right">{!isFee && tx.amount >= 0 ? formatCurrency(tx.amount) : ''}</td>
                                        <td className="p-2 text-right">{formatCurrency(tx.balance)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default StatementPage;
