
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { db } from '@/app/lib/firebase';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const formatStatementCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


const StatementComponent = ({ account, transactions }: { account: Account, transactions: Transaction[] }) => {
    const openingBalance = transactions.reduce((acc, tx) => tx.type === 'credit' ? acc - tx.amount : acc + tx.amount, account.balance);
    const totalCredits = transactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebits = transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return (
        <div id="statement-pdf" className="bg-white text-black font-sans" style={{ fontSize: '7px', lineHeight: '1.2' }}>
            <div className="p-8 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="w-2/3 space-y-4">
                         <div className="border border-gray-400 p-1 inline-block">
                            <p className="font-bold">eConfirm</p>
                            <p className="text-xs">20230105</p>
                        </div>
                        <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/barcode.png?alt=media&token=3883a48e-88c9-4cf3-a714-b15f60e9275e" alt="barcode" width={200} height={20} />
                        <div>
                            <p>MR</p>
                            <p>CORRIE DIRK VAN SCHALKWYK</p>
                            <p>SAVVY BUNDLE PLATINUM</p>
                            <p>PO BOX 135</p>
                            <p>RIVONIA</p>
                            <p>JOHANNESBURG</p>
                            <p>2128</p>
                        </div>
                    </div>
                    <div className="w-1/3 text-right">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" alt="Nedbank Logo" width={60} height={60} className="ml-auto" />
                        <div className="text-[6px] mt-2 space-y-1">
                            <p>135 Rivonia Road, Sandown, 2196</p>
                            <p>P O Box 1144, Johannesburg, 2000, South Africa</p>
                            <hr className="my-1 border-gray-400" />
                            <p>Bank VAT Reg No. 4320116074</p>
                            <p>Lost cards 0800 110 929</p>
                            <p>Client services 0860 555 111</p>
                            <p>nedbank.co.za</p>
                            <hr className="my-1 border-gray-400" />
                            <p className="font-bold">Tax invoice</p>
                        </div>
                    </div>
                </div>

                {/* Fee change notice */}
                <div className="bg-[#009C6D] text-white p-2">
                    <p className="font-bold">Some of our fees will change on 1 January 2023.</p>
                    <p className="text-[6px]">Most digital transaction fees will stay the same, while cash transactions will cost more. For more information and cost-saving tips visit personal.nedbank.co.za/fees or any branch.</p>
                </div>

                <div className="border border-gray-400 p-1 text-[6px]">
                    <p>Please examine this statement soonest. If no errors are reported within 30 days after receipt, the statement will be considered as being correct.</p>
                </div>

                {/* Account Summary */}
                <div>
                    <h2 className="font-bold text-xs mb-1">Account summary</h2>
                    <div className="bg-[#00573D] text-white p-2 flex justify-between">
                        <div>
                            <p>Account type</p>
                            <p className="font-bold text-sm">Current account</p>
                        </div>
                        <div>
                            <p>Account number</p>
                            <p className="font-bold text-sm">{account.accountNumber}</p>
                        </div>
                    </div>
                    <table className="w-full my-2 text-[6px]">
                        <tbody>
                            <tr>
                                <td className="font-bold pr-4">Statement date</td><td className="pr-4">03/01/2023</td>
                                <td className="font-bold pr-4">Envelope</td><td>1 of 1</td>
                            </tr>
                            <tr>
                                <td className="font-bold pr-4">Statement period</td><td className="pr-4">03/12/2022 - 03/01/2023</td>
                                <td className="font-bold pr-4">Total pages</td><td>2</td>
                            </tr>
                            <tr>
                                <td className="font-bold pr-4">Statement frequency</td><td className="pr-4">Monthly</td>
                                <td className="font-bold pr-4">Client VAT number</td><td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Bank Charges and Cashflow */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-xs">Bank charges summary</h3>
                        <table className="w-full text-[6px]">
                            <tbody>
                                <tr><td>Electronic banking fees</td><td className="text-right">R25.50</td></tr>
                                <tr><td>Other charges</td><td className="text-right">R0.00</td></tr>
                                <tr><td>Bank charges (Excl VAT)</td><td className="text-right">R25.50</td></tr>
                                <tr><td>VAT Inclusive @</td><td>15.00%</td></tr>
                                <tr><td>VAT calculated on R45.50</td><td className="text-right">R6.74</td></tr>
                            </tbody>
                        </table>
                    </div>
                     <div>
                        <h3 className="font-bold text-xs">Cashflow</h3>
                        <table className="w-full text-[6px]">
                            <tbody>
                                <tr><td>Opening balance</td><td className="text-right">R{formatStatementCurrency(openingBalance)}</td></tr>
                                <tr><td>Funds received/Credits</td><td className="text-right">R{formatStatementCurrency(totalCredits)}</td></tr>
                                <tr><td>Funds used/Debits</td><td className="text-right">R{formatStatementCurrency(totalDebits)}</td></tr>
                                <tr><td>Closing balance</td><td className="text-right font-bold">R{formatStatementCurrency(account.balance)}</td></tr>
                                <tr><td>Annual credit interest rate</td><td className="text-right">0.00%</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Graphs placeholder */}
                <div className="grid grid-cols-2 gap-4 h-24">
                   <div className="border p-1"><p className="text-center text-xs text-gray-400">[Chart Placeholder]</p></div>
                   <div className="border p-1"><p className="text-center text-xs text-gray-400">[Chart Placeholder]</p></div>
                </div>
                
                {/* Footer section 1 */}
                <div className="flex justify-between items-end">
                    <p className="font-bold text-gray-500">see money differently</p>
                    <p className="text-[6px] text-gray-500 text-right w-1/2">
                        We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCRCP16).
                    </nedbank>
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" alt="Nedbank Logo" width={40} height={40} />
                    <p>Page 1 of 2</p>
                </div>
            </div>

            {/* Page 2 */}
            <div className="p-8 space-y-4" style={{ breakBefore: 'page' }}>
                 <div className="flex justify-between items-start">
                    <div className="border border-gray-400 p-1 inline-block">
                        <p className="font-bold">eConfirm</p>
                        <p className="text-xs">20230105</p>
                    </div>
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" alt="Nedbank Logo" width={60} height={60} className="ml-auto" />
                 </div>
                 
                 <div>
                    <h3 className="font-bold text-xs">Bank charges for the period 3 December 2022 to 3 January 2023</h3>
                    <table className="w-full text-[6px] mt-1">
                        <thead className="bg-[#00573D] text-white">
                            <tr>
                                <th className="p-1 text-left">Narrative Description</th>
                                <th className="p-1 text-right">Item cost (R)</th>
                                <th className="p-1 text-right">VAT (R)</th>
                                <th className="p-1 text-right">Total (R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b"><td className="p-1">Electronic banking fees</td><td className="text-right p-1">22.17</td><td className="text-right p-1">3.33</td><td className="text-right p-1">25.50</td></tr>
                            <tr className="border-b"><td className="p-1">Other charges</td><td className="text-right p-1">0.00</td><td className="text-right p-1">0.00</td><td className="text-right p-1">0.00</td></tr>
                            <tr className="font-bold"><td className="p-1">Total charges</td><td></td><td></td><td className="text-right p-1">25.50</td></tr>
                        </tbody>
                    </table>
                 </div>

                 <div>
                    <table className="w-full text-[6px] mt-4">
                        <thead className="bg-[#00573D] text-white">
                            <tr>
                                <th className="p-1 text-left">Tran date</th>
                                <th className="p-1 text-left">Date</th>
                                <th className="p-1 text-left">Description</th>
                                <th className="p-1 text-right">Fees (R)</th>
                                <th className="p-1 text-right">Debits (R)</th>
                                <th className="p-1 text-right">Credits (R)</th>
                                <th className="p-1 text-right">Balance (R)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b font-bold"><td className="p-1" colSpan={6}>Opening balance</td><td className="text-right p-1">{formatStatementCurrency(openingBalance)}</td></tr>
                            {transactions.map(tx => (
                                <tr key={tx.id} className="border-b">
                                    <td className="p-1">{format(new Date(tx.date), 'dd/MM/yy')}</td>
                                    <td className="p-1">{format(new Date(tx.date), 'dd/MM/yy')}</td>
                                    <td className="p-1">{tx.description}</td>
                                    <td className="p-1 text-right"></td>
                                    <td className="p-1 text-right">{tx.type === 'debit' ? formatStatementCurrency(Math.abs(tx.amount)) : ''}</td>
                                    <td className="p-1 text-right">{tx.type === 'credit' ? formatStatementCurrency(tx.amount) : ''}</td>
                                    <td className="p-1 text-right"></td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-100"><td className="p-1" colSpan={6}>Closing balance</td><td className="text-right p-1">{formatStatementCurrency(account.balance)}</td></tr>
                        </tbody>
                    </table>
                 </div>

                 <div className="flex justify-between items-end pt-10">
                    <p className="font-bold text-gray-500">see money differently</p>
                    <p className="text-[6px] text-gray-500 text-right w-1/2">
                        We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCRCP16).
                    </nedbank>
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" alt="Nedbank Logo" width={40} height={40} />
                    <p>Page 2 of 2</p>
                </div>

            </div>
        </div>
    );
};


export default function StatementPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id as string;
  
    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accountId) return;
    
        const fetchAccountData = async () => {
          try {
            setLoading(true);
            const accountRef = doc(db, 'accounts', accountId);
            const accountSnap = await getDoc(accountRef);
    
            if (accountSnap.exists()) {
              const data = accountSnap.data();
              setAccount({
                id: accountSnap.id,
                name: data.name,
                type: data.type,
                accountNumber: data.accountNumber,
                balance: data.balance,
                currency: data.currency,
              });
    
              const transactionsRef = collection(db, 'accounts', accountId, 'transactions');
              const transactionsSnap = await getDocs(transactionsRef);
              const transactionsData = transactionsSnap.docs.map(doc => {
                const txData = doc.data();
                const date = txData.date instanceof Timestamp ? txData.date.toDate().toISOString() : txData.date;
                return {
                  id: doc.id,
                  date: date,
                  description: txData.description,
                  amount: txData.amount,
                  type: txData.type,
                  reference: txData.reference,
                };
              });
              setTransactions(transactionsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
            } else {
              setError('Account not found');
            }
          } catch (err) {
            console.error(err);
            setError('Failed to fetch account details.');
          } finally {
            setLoading(false);
          }
        };
    
        fetchAccountData();
    }, [accountId]);

    const handleDownloadPdf = () => {
        setGeneratingPdf(true);
        const input = document.getElementById('statement-pdf');
        if (input) {
            html2canvas(input, { 
                scale: 3, 
                useCORS: true 
            }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                let heightLeft = pdfHeight;
                let position = 0;
                const pageHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }

                pdf.save(`statement-${accountId}.pdf`);
                setGeneratingPdf(false);
            });
        } else {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="font-semibold">Bank Statement</h1>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={loading || generatingPdf || !account}>
                {generatingPdf ? (
                    <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </>
                )}
              </Button>
            </header>

            <main className="flex-1 overflow-y-auto">
                {loading && <StatementLoadingSkeleton />}
                {error && <p className="p-4 text-red-500">{error}</p>}
                {!loading && !error && account && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementComponent account={account} transactions={transactions} />
                    </div>
                )}
            </main>
        </div>
    );
}

    