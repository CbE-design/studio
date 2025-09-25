
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { accounts, transactions } from '@/app/lib/data';


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
  
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { toast } = useToast();
    
    const account = accounts.find(acc => acc.id === accountId);
    const accountTransactions = transactions[accountId] || [];

    const sortedTransactions = useMemo(() => {
        return [...accountTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [accountTransactions]);
    
    const isLoading = false; // Replace with actual loading state if any
    const error = !account ? new Error('Account not found') : null;

    const handleDownloadPdf = async () => {
        if (!account) return;

        setGeneratingPdf(true);

        try {
            const existingPdfBytes = await fetch('/api/pdf-template').then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            const page = pdfDoc.getPages()[0];
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const textColor = rgb(0.1, 0.1, 0.1);

            const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {
                style: 'currency',
                currency: account.currency,
            }).format(amount);
            
            // Draw text directly on the page, ensuring all values are strings
            page.drawText('Valued Customer', { x: 72, y: height - 158, font, size: 10, color: textColor });
            page.drawText(account.name || '', { x: 72, y: height - 180, font, size: 10, color: textColor });
            page.drawText(account.accountNumber || '', { x: 72, y: height - 202, font, size: 10, color: textColor });
            page.drawText(format(new Date(), 'dd MMMM yyyy'), { x: 450, y: height - 158, font, size: 10, color: textColor });
            page.drawText(formatCurrency(account.balance), { x: 450, y: height - 180, font, size: 10, color: textColor });
            
            const maxTransactions = 10;
            let yPosition = height - 280;

            sortedTransactions.slice(0, maxTransactions).forEach((tx) => {
                page.drawText(format(new Date(tx.date), 'dd MMM yyyy'), { x: 72, y: yPosition, font, size: 9, color: textColor });
                page.drawText(tx.description || '', { x: 150, y: yPosition, font, size: 9, color: textColor });
                page.drawText(tx.reference || '', { x: 300, y: yPosition, font, size: 9, color: textColor });
                page.drawText(formatCurrency(tx.amount), { x: 450, y: yPosition, font, size: 9, color: textColor });
                yPosition -= 20;
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
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isLoading || generatingPdf || !account}>
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
                {isLoading && <StatementLoadingSkeleton />}
                {error && <p className="p-4 text-red-500 bg-red-50 rounded-md">{error.message}</p>}
                {!isLoading && !error && account && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementComponent account={account} />
                    </div>
                )}
            </main>
        </div>
    );
}
