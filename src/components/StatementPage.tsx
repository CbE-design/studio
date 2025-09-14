
'use client';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { generateStatementPdf, GenerateStatementPdfInput } from '@/ai/flows/generate-statement-pdf';


const StatementPage = ({ accountName, transactions, balance, setCurrentView, previousView }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const sortedTransactions = useMemo(() => 
        [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), 
    [transactions]);
    
    const calculations = useMemo(() => {
        let openingBalance = balance;
        // Calculate opening balance by reversing all transactions for the current view
        const transactionsInView = sortedTransactions.map(tx => ({
            ...tx,
            amountValue: parseFloat(tx.amount.replace('R', '').replace(/ /g, ''))
        }));

        const totalCredits = transactionsInView.filter(tx => tx.amountValue > 0).reduce((sum, tx) => sum + tx.amountValue, 0);
        const totalDebits = transactionsInView.filter(tx => tx.amountValue < 0).reduce((sum, tx) => sum + tx.amountValue, 0);
        
        openingBalance = balance - (totalCredits + totalDebits);

        let totalFees = 0;
        
        let runningBalance = openingBalance;
        const finalTransactions = transactionsInView.map(tx => {
            runningBalance += tx.amountValue;
            if (tx.description.toLowerCase().includes('fee:')) {
                totalFees += Math.abs(tx.amountValue);
            }
            return { ...tx, balance: runningBalance };
        });

        return {
            openingBalance,
            totalFees,
            finalTransactions,
        };
    }, [sortedTransactions, balance]);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const firstTxDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].timestamp) : new Date();
            const lastTxDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[sortedTransactions.length - 1].timestamp) : new Date();

            // THIS IS THE CORRECTED, FLAT INPUT OBJECT
            const input: GenerateStatementPdfInput = {
                statementDate: new Date().toISOString().split('T')[0],
                statementPeriod: {
                    from: firstTxDate.toISOString().split('T')[0],
                    to: lastTxDate.toISOString().split('T')[0],
                },
                openingBalance: calculations.openingBalance,
                bankCharges: {
                    electronicBankingFees: calculations.totalFees,
                    initiationFee: 0,
                    transactionServiceFees: 0,
                    otherCharges: 0,
                    totalCharges: calculations.totalFees,
                    vatRate: 15.0,
                },
                transactions: calculations.finalTransactions.map(tx => {
                    const isFee = tx.description.toLowerCase().includes('fee:');
                    return {
                        transactionId: tx.id || null,
                        date: new Date(tx.timestamp).toISOString().split('T')[0],
                        description: tx.description,
                        fees: isFee ? Math.abs(tx.amountValue) : 0.00,
                        debit: !isFee && tx.amountValue < 0 ? Math.abs(tx.amountValue) : 0.00,
                        credit: !isFee && tx.amountValue > 0 ? tx.amountValue : 0.00,
                        balance: tx.balance,
                    }
                })
            };

            const { pdfBase64 } = await generateStatementPdf(input);

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

    const statementPeriod = useMemo(() => {
        if (sortedTransactions.length === 0) return "N/A";
        const startDate = new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const endDate = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        return `${startDate} to ${endDate}`;
    }, [sortedTransactions]);
    
    const formatCurrency = (value: number) => {
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
                 <div className="border rounded-lg p-2 mb-4 w-32">
                    <p className="font-bold text-center text-primary">eConfirm</p>
                    <p className="text-xs text-center">{new Date().toLocaleDateString('en-GB')}</p>
                </div>

                <h2 className="font-bold mb-2">Bank charges for the period {statementPeriod}</h2>
                
                <div className="overflow-x-auto mb-8">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#00703C] text-white">
                            <tr>
                                <th className="p-2 font-semibold">NarrativeDescription</th>
                                <th className="p-2 font-semibold text-right">Total(R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2">Electronic banking fees</td>
                                <td className="p-2 text-right">{formatCurrency(calculations.totalFees)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td className="p-2">TotalCharges</td>
                                <td className="p-2 text-right">{formatCurrency(calculations.totalFees)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#00703C] text-white">
                            <tr>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold">Description</th>
                                <th className="p-2 font-semibold text-right">Debits(R)</th>
                                <th className="p-2 font-semibold text-right">Credits(R)</th>
                                <th className="p-2 font-semibold text-right">Balance(R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b font-bold">
                                <td className="p-2">{sortedTransactions.length > 0 ? new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB') : '-'}</td>
                                <td className="p-2">Openingbalance</td>
                                <td className="p-2"></td>
                                <td className="p-2"></td>
                                <td className="p-2 text-right">{formatCurrency(calculations.openingBalance)}</td>
                            </tr>
                            {calculations.finalTransactions.map((tx, index) => (
                                    <tr key={tx.id || index} className="border-b">
                                        <td className="p-2">{new Date(tx.timestamp).toLocaleDateString('en-GB')}</td>
                                        <td className="p-2">{tx.description}</td>
                                        <td className="p-2 text-right">{tx.amountValue < 0 ? formatCurrency(Math.abs(tx.amountValue)) : ''}</td>
                                        <td className="p-2 text-right">{tx.amountValue >= 0 ? formatCurrency(tx.amountValue) : ''}</td>
                                        <td className="p-2 text-right">{formatCurrency(tx.balance)}</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default StatementPage;
