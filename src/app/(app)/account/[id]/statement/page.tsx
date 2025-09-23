
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { db } from '@/app/lib/firebase';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, toDate } from 'date-fns';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const StatementComponent = ({ account, transactions }: { account: Account, transactions: Transaction[] }) => {
    // This component is now just a placeholder for the PDF generation, 
    // as the visual display is handled by the PDF itself.
    // We can show a simple preview or message.
    return (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold mb-4">Statement Ready for Download</h2>
            <p className="text-gray-600">Click the "Download PDF" button to get your statement.</p>
            <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.accountNumber}</p>
                <p className="text-2xl font-bold mt-2">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: account.currency }).format(account.balance)}</p>
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

    const handleDownloadPdf = async () => {
        if (!account || transactions.length === 0) return;

        setGeneratingPdf(true);

        try {
            const pdfUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/templates%2FFebruary2023.pdf?alt=media&token=06231415-0e28-473f-96e0-c18630fc3744';
            const existingPdfBytes = await fetch(pdfUrl, { mode: 'cors' }).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const firstPage = pdfDoc.getPages()[0];
            const { width, height } = firstPage.getSize();

            const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {
                style: 'currency',
                currency: account.currency,
            }).format(amount);

            // Add Account Details
            firstPage.drawText(`Account: ${account.name} (${account.accountNumber})`, {
                x: 50,
                y: height - 50,
                font: helveticaFont,
                size: 12,
                color: rgb(0, 0, 0),
            });
            firstPage.drawText(`Current Balance: ${formatCurrency(account.balance)}`, {
                x: 50,
                y: height - 70,
                font: helveticaFont,
                size: 12,
                color: rgb(0, 0, 0),
            });
            
            // Add Transactions
            firstPage.drawText('Transactions', {
                x: 50,
                y: height - 100,
                font: helveticaFont,
                size: 14,
                color: rgb(0, 0, 0),
            });

            let yPosition = height - 120;
            transactions.forEach(tx => {
                if (yPosition < 50) return; // Stop if we run out of space
                const date = format(toDate(tx.date), 'yyyy-MM-dd');
                const description = tx.description;
                const amount = tx.type === 'debit' ? `-${formatCurrency(tx.amount)}` : formatCurrency(tx.amount);
                
                firstPage.drawText(`${date} - ${description} - ${amount}`, {
                    x: 60,
                    y: yPosition,
                    font: helveticaFont,
                    size: 10,
                    color: rgb(0.2, 0.2, 0.2),
                });
                yPosition -= 15;
            });
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `statement-${account.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            setError("Could not download or generate the PDF. Please check the template URL and Firebase Storage rules.");
        } finally {
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

            <main className="flex-1 overflow-y-auto p-4">
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
