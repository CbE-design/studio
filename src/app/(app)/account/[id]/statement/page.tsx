
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Account, Transaction } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query } from 'firebase/firestore';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const StatementComponent = ({ account, transactions }: { account: Account, transactions: Transaction[] }) => {
    
    const formatCurrency = (amount: number, currency: string = 'ZAR') => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getRunningBalance = (index: number) => {
        let balance = account.balance; // Start with the final balance
        // To get the balance at transaction `index`, we reverse the effect of all subsequent transactions
        for (let i = 0; i < index; i++) {
            const tx = transactions[i];
            if (tx.type === 'credit') {
                balance -= tx.amount;
            } else {
                balance += tx.amount;
            }
        }
        return balance;
    }

    const openingBalance = getRunningBalance(transactions.length);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center pb-4 border-b">
                 <div className="text-left">
                    <h2 className="text-xl font-bold">{account.name}</h2>
                    <p className="text-gray-600">{account.accountNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Statement Date</p>
                    <p className="font-semibold">{format(new Date(), 'dd MMMM yyyy')}</p>
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
                            <td className="p-2">{format(new Date(transactions[transactions.length - 1]?.date || new Date()), 'dd/MM/yyyy')}</td>
                            <td className="p-2 font-semibold">Opening Balance</td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right font-medium">{formatCurrency(openingBalance)}</td>
                        </tr>
                        {transactions.map((tx, index) => {
                             const balanceAfterTx = getRunningBalance(transactions.length - 1 - index);
                             return (
                                <tr key={tx.id} className="border-b last:border-0">
                                    <td className="p-2">{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                                    <td className="p-2">{tx.description}</td>
                                    <td className="p-2 text-right text-red-600">
                                        {tx.type === 'debit' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="p-2 text-right text-green-600">
                                        {tx.type === 'credit' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(balanceAfterTx)}</td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function StatementPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id as string;
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
  
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { toast } = useToast();
    
    const [account, setAccount] = useState<Account | null>(null);
    const [isAccountLoading, setIsAccountLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user?.uid || !accountId) {
            if (!isUserLoading) setIsAccountLoading(false);
            return;
        }

        const fetchAccountData = async () => {
            setIsAccountLoading(true);
            try {
                const accountDocRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
                const docSnap = await getDoc(accountDocRef);
                if (docSnap.exists()) {
                    setAccount({ id: docSnap.id, ...docSnap.data() } as Account);
                } else {
                    console.error("Account document not found");
                    setAccount(null);
                }
            } catch (error) {
                console.error("Error fetching account details:", error);
            } finally {
                setIsAccountLoading(false);
            }
        };
        fetchAccountData();
    }, [firestore, user?.uid, accountId, isUserLoading]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !accountId) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'transactions'));
    }, [firestore, user?.uid, accountId]);

    const { data: accountTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const sortedTransactions = useMemo(() => {
        if (!accountTransactions) return [];
        // Sort ascending for statement view
        return [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [accountTransactions]);
    
    const isLoading = isUserLoading || isAccountLoading || isTransactionsLoading;
    const error = !account && !isLoading ? new Error('Account not found') : null;

    const handleDownloadPdf = async () => {
        if (!account || !sortedTransactions) return;
        setGeneratingPdf(true);

        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const primaryColor = rgb(0.0, 0.447, 0.243); // #00723E
            const black = rgb(0, 0, 0);
            const gray = rgb(0.3, 0.3, 0.3);
            const red = rgb(0.8, 0, 0);
            const green = rgb(0, 0.6, 0);
            const margin = 40;

            const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);

            // --- Header ---
            const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
            const proxyLogoUrl = `/api/image-proxy?url=${encodeURIComponent(logoUrl)}`;
            const logoImageBytes = await fetch(proxyLogoUrl).then(res => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            const logoDims = logoImage.scale(0.25);
            
            page.drawImage(logoImage, {
                x: margin,
                y: height - margin - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            page.drawText('STATEMENT', { x: width - margin - 100, y: height - margin - 20, font: boldFont, size: 16, color: black });
            page.drawText(account.name, { x: width - margin - 150, y: height - margin - 45, font: font, size: 10, color: gray });
            page.drawText(account.accountNumber, { x: width - margin - 150, y: height - margin - 60, font: font, size: 10, color: gray });
            page.drawText(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, { x: width - margin - 150, y: height - margin - 75, font: font, size: 10, color: gray });

            // --- Table ---
            let y = height - margin - logoDims.height - 60;
            const tableTop = y;

            // Table Header
            page.drawRectangle({ x: margin, y: y - 22, width: width - margin * 2, height: 22, color: primaryColor });
            const headers = ['Date', 'Description', `Debits(${account.currency})`, `Credits(${account.currency})`, `Balance(${account.currency})`];
            const colWidths = [60, 215, 80, 80, 80];
            let x = margin + 5;
            headers.forEach((header, i) => {
                page.drawText(header, { x: x, y: y - 15, font: boldFont, size: 9, color: rgb(1, 1, 1) });
                x += colWidths[i];
            });
            y -= 30; // Row height
            
            // Calculate opening balance
            const getRunningBalance = (index: number) => {
                let balance = account.balance; // Start with the final balance
                for (let i = 0; i < index; i++) {
                    const tx = sortedTransactions[i];
                    balance = tx.type === 'credit' ? balance - tx.amount : balance + tx.amount;
                }
                return balance;
            }
            const openingBalance = getRunningBalance(sortedTransactions.length);

            // Opening Balance Row
            page.drawText(format(new Date(sortedTransactions[0]?.date || Date.now()), 'dd/MM/yyyy'), { x: margin + 5, y, font, size: 9, color: black });
            page.drawText('Opening Balance', { x: margin + colWidths[0], y, font, size: 9, color: black });
            page.drawText(formatCurrency(openingBalance), { x: width - margin - colWidths[4] + 10, y, font, size: 9, color: black });
            y -= 20;

            // Transaction Rows
            let currentBalance = openingBalance;
            for (const tx of sortedTransactions) {
                 if (y < margin + 40) { // Check for page break
                    page = pdfDoc.addPage();
                    y = height - margin;
                 }
                currentBalance = tx.type === 'credit' ? currentBalance + tx.amount : currentBalance - tx.amount;
                page.drawText(format(new Date(tx.date), 'dd/MM/yyyy'), { x: margin + 5, y, font, size: 9, color: black });
                page.drawText(tx.description.substring(0, 40), { x: margin + colWidths[0], y, font, size: 9, color: black });
                if(tx.type === 'debit') {
                   page.drawText(formatCurrency(tx.amount), { x: margin + colWidths[0] + colWidths[1] + 10, y, font, size: 9, color: red });
                } else {
                   page.drawText(formatCurrency(tx.amount), { x: margin + colWidths[0] + colWidths[1] + colWidths[2] + 10, y, font, size: 9, color: green });
                }
                page.drawText(formatCurrency(currentBalance), { x: width - margin - colWidths[4] + 10, y, font, size: 9, color: black });
                y -= 20;
            }

            // --- Footer ---
            page.drawText('seemoneydifferently', { x: (width / 2) - 50, y: margin, font: boldFont, size: 10, color: primaryColor });


            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `statement-${account.id}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e: any) {
            console.error("Failed to generate PDF:", e);
            toast({
              variant: 'destructive',
              title: 'PDF Generation Failed',
              description: e.message || 'An unknown error occurred.',
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
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isLoading || generatingPdf || !account || sortedTransactions.length === 0}>
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
                {!isLoading && !error && account && sortedTransactions.length > 0 && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementComponent account={account} transactions={sortedTransactions} />
                    </div>
                )}
                 {!isLoading && !error && account && sortedTransactions.length === 0 && (
                    <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm max-w-4xl mx-auto my-4">
                        <p>No transactions found for this account to generate a statement.</p>
                    </div>
                 )}
            </main>
        </div>
    );
}
