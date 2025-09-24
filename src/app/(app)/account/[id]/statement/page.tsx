
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { db } from '@/app/lib/firebase';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const StatementComponent = ({ account }: { account: Account }) => {
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
    const { toast } = useToast();

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
              setTransactions(transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
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
        if (!account) return;

        setGeneratingPdf(true);

        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const margin = 50;

            const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-ZA', {
                style: 'currency',
                currency: currency,
            }).format(amount);

            let y = height - margin;

            // Header
            page.drawText('Bank Statement', {
                x: margin,
                y: y,
                font: boldFont,
                size: 24,
                color: rgb(0.10, 0.28, 0.54), // primary color
            });
            y -= 40;

            // Account Details
            page.drawText('Account Details', { x: margin, y, font: boldFont, size: 14 });
            y -= 20;
            page.drawText(`Account Holder: SPOT BUY AND SELL`, { x: margin, y, font, size: 10 });
            y -= 15;
            page.drawText(`Account: ${account.name} (${account.accountNumber})`, { x: margin, y, font, size: 10 });
            y -= 15;
            page.drawText(`Statement Date: ${format(new Date(), 'dd MMMM yyyy')}`, { x: margin, y, font, size: 10 });
            y -= 15;
            page.drawText(`Current Balance: ${formatCurrency(account.balance, account.currency)}`, { x: margin, y, font: boldFont, size: 12, color: rgb(0.15, 0.65, 0.38) });
            y -= 40;

            // Transactions Header
            page.drawText('Transactions', { x: margin, y, font: boldFont, size: 14 });
            y -= 20;

            const tableTop = y;
            const rowHeight = 20;
            const tableBottomMargin = margin + 20;
            
            // Draw Table Header
            page.drawText('Date', { x: margin, y, font: boldFont, size: 10 });
            page.drawText('Description', { x: margin + 80, y, font: boldFont, size: 10 });
            page.drawText('Amount', { x: width - margin - 100, y, font: boldFont, size: 10 });
            y -= rowHeight;
            page.drawLine({
                start: { x: margin, y: y + 10 },
                end: { x: width - margin, y: y + 10 },
                thickness: 1,
                color: rgb(0.8, 0.8, 0.8),
            });
            
            // Draw Transactions
            transactions.forEach(tx => {
                if (y < tableBottomMargin) return;
                
                const date = format(new Date(tx.date), 'dd MMM yyyy');
                const description = tx.description.substring(0, 50); 
                const amountText = formatCurrency(tx.amount, account.currency);
                const textColor = tx.type === 'debit' ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.5, 0.1);
                
                page.drawText(date, { x: margin, y, font, size: 9 });
                page.drawText(description, { x: margin + 80, y, font, size: 9 });
                page.drawText(amountText, { x: width - margin - 100, y, font, size: 9, color: textColor });
                
                y -= rowHeight;
            });
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `statement-${account.id}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error: any) {
            console.error("Failed to generate PDF:", error);
            setError("Could not generate the PDF. Please try again.");
            toast({
              variant: 'destructive',
              title: 'PDF Generation Failed',
              description: error.message || 'An unknown error occurred while trying to generate the PDF.',
            });
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
                {error && <p className="p-4 text-red-500 bg-red-50 rounded-md">{error}</p>}
                {!loading && !error && account && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementComponent account={account} />
                    </div>
                )}
            </main>
        </div>
    );
}
