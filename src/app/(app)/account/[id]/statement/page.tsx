
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
import { PDFDocument } from 'pdf-lib';
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
            const existingPdfBytes = await fetch('/api/pdf-template').then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            const form = pdfDoc.getForm();

            // --- Diagnostic Logging ---
            const fields = form.getFields();
            console.log('Available PDF fields:');
            fields.forEach(field => {
                const type = field.constructor.name;
                const name = field.getName();
                console.log(`${type}: ${name}`);
            });
            // -------------------------
            
            try {
              form.getTextField('account_holder').setText('SPOT BUY AND SELL');
              form.getTextField('account_name').setText(account.name);
              form.getTextField('account_number').setText(account.accountNumber);
              form.getTextField('statement_date').setText(format(new Date(), 'dd MMMM yyyy'));
              
              const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {
                  style: 'currency',
                  currency: account.currency,
              }).format(amount);

              form.getTextField('current_balance').setText(formatCurrency(account.balance));

              const maxTransactions = 10;
              transactions.slice(0, maxTransactions).forEach((tx, index) => {
                  const i = index + 1;
                  form.getTextField(`date_${i}`).setText(format(new Date(tx.date), 'dd MMM yyyy'));
                  form.getTextField(`description_${i}`).setText(tx.description);
                  form.getTextField(`reference_${i}`).setText(tx.reference);
                  const amountField = form.getTextField(`amount_${i}`);
                  amountField.setText(formatCurrency(tx.amount));
              });

              form.flatten();
            } catch (fieldError: any) {
              console.error("Error filling PDF fields:", fieldError);
              throw new Error(`Failed to fill PDF. The field '${fieldError.message.split('"')[1]}' might be incorrect. Check the console log for a list of available fields.`);
            }
            
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
            setError(error.message || "Could not generate the PDF. Please try again.");
            toast({
              variant: 'destructive',
              title: 'PDF Generation Failed',
              description: error.message || 'An unknown error occurred while trying to generate the PDF.',
              duration: 10000,
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
