
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Account, Transaction, User } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb, PDFFont, PageSizes } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query } from 'firebase/firestore';
import { StatementSummaryPage } from '@/components/statement-summary';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-96 w-full mt-4" />
  </div>
);

const StatementTransactionsPage = ({ account, transactions, openingBalance }: { account: Account, transactions: Transaction[], openingBalance: number }) => {
    
    const formatCurrency = (amount: number, currency: string = 'ZAR') => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    let runningBalance = openingBalance;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <div className="flex justify-between items-center pb-4 border-b">
                 <div className="text-left">
                    <h2 className="text-xl font-bold">{account.name} - Transactions</h2>
                    <p className="text-gray-600">{account.accountNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Page 2 of 2</p>
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
                            <td className="p-2">{format(new Date(transactions[0]?.date || new Date()), 'dd/MM/yyyy')}</td>
                            <td className="p-2 font-semibold">Opening Balance</td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right font-medium">{formatCurrency(openingBalance)}</td>
                        </tr>
                        {transactions.map((tx) => {
                             runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
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
                                    <td className="p-2 text-right font-medium">{formatCurrency(runningBalance)}</td>
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

    const [userData, setUserData] = useState<User | null>(null);

    useEffect(() => {
        if (!firestore || !user?.uid) return;

        const fetchUserData = async () => {
             const userDocRef = doc(firestore, 'users', user.uid);
             const userDoc = await getDoc(userDocRef);
             if (userDoc.exists()) {
                setUserData(userDoc.data() as User);
             }
        }
        fetchUserData();

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
    }, [firestore, user, accountId, isUserLoading]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !accountId) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'transactions'));
    }, [firestore, user?.uid, accountId]);

    const { data: accountTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const sortedTransactions = useMemo(() => {
        if (!accountTransactions) return [];
        return [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [accountTransactions]);
    
    const {openingBalance, closingBalance, totalDebits, totalCredits} = useMemo(() => {
        if (!account || !sortedTransactions || sortedTransactions.length === 0) {
            return { openingBalance: 0, closingBalance: account?.balance || 0, totalDebits: 0, totalCredits: 0 };
        }

        const debits = sortedTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
        const credits = sortedTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
        
        const closing = account.balance;
        const opening = closing + debits - credits;
        
        return { openingBalance: opening, closingBalance: closing, totalDebits: debits, totalCredits: credits };

    }, [account, sortedTransactions]);

    const isLoading = isUserLoading || isAccountLoading || isTransactionsLoading;
    const error = !account && !isLoading ? new Error('Account not found') : null;

    const handleDownloadPdf = async () => {
        if (!account || !sortedTransactions || !userData) return;
        setGeneratingPdf(true);

        try {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            
            const embedImage = async (imageBytes: ArrayBuffer) => {
                try {
                    return await pdfDoc.embedPng(imageBytes);
                } catch (pngError) {
                    try {
                        return await pdfDoc.embedJpg(imageBytes);
                    } catch (jpgError) {
                        console.error("Failed to embed image as PNG or JPG", { pngError, jpgError });
                        throw new Error("Unsupported image format. Please use PNG or JPEG.");
                    }
                }
            };

            const primaryColor = rgb(0.0, 0.447, 0.243); // #00723E
            const black = rgb(0, 0, 0);
            const gray = rgb(0.3, 0.3, 0.3);
            const red = rgb(0.8, 0, 0);
            const green = rgb(0.1, 0.7, 0.1);
            const lightGray = rgb(0.95, 0.95, 0.95);

            const nLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
            const eConfirmLogoUrl = PlaceHolderImages.find(i => i.id === 'statement-econfirm')?.imageUrl!;
            const barcodeUrl = PlaceHolderImages.find(i => i.id === 'statement-barcode')?.imageUrl!;
            
            const [nLogoBytes, eConfirmBytes, barcodeBytes] = await Promise.all([
                 fetch(`/api/image-proxy?url=${encodeURIComponent(nLogoUrl)}`).then(res => res.arrayBuffer()),
                 fetch(`/api/image-proxy?url=${encodeURIComponent(eConfirmLogoUrl)}`).then(res => res.arrayBuffer()),
                 fetch(`/api/image-proxy?url=${encodeURIComponent(barcodeUrl)}`).then(res => res.arrayBuffer()),
            ]);

            const nLogoImage = await embedImage(nLogoBytes);
            const eConfirmImage = await embedImage(eConfirmBytes);
            const barcodeImage = await embedImage(barcodeBytes);
            
            // --- Summary Page (Page 1) ---
            let page = pdfDoc.addPage(PageSizes.A4);
            let { width, height } = page.getSize();
            let y = height;
            const margin = 40;

            // Header section
            y -= 60;
            page.drawImage(eConfirmImage, { x: margin, y, width: 80, height: 40 });
            page.drawImage(nLogoImage, { x: width - margin - 50, y: y + 20, width: 50, height: 26 });
            y -= 50;

            page.drawImage(barcodeImage, { x: margin, y: y+20, width: 250, height: 20 });
            
            const rightAddressX = width - margin - 200;
            page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightAddressX, y: y + 20, font, size: 8, color: gray });
            page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightAddressX, y: y + 10, font, size: 8, color: gray });
            
            y -= 20;
            page.drawText('Mr', { x: margin, y, font, size: 9, color: black });
            y -= 12;
            page.drawText((userData.firstName || 'UNDEFINED' + ' ' + (userData.lastName || 'UNDEFINED')).toUpperCase(), { x: margin, y, font: boldFont, size: 9, color: black });
            y -= 12;
            page.drawText(account.name.toUpperCase(), { x: margin, y, font: boldFont, size: 9, color: black });
            y -= 24;
            page.drawText('PO BOX 135', { x: margin, y, font, size: 9, color: black });
            y -= 12;
            page.drawText('RIVONIA', { x: margin, y, font, size: 9, color: black });
            y -= 12;
            page.drawText('JOHANNESBURG', { x: margin, y, font, size: 9, color: black });
            y -= 12;
            page.drawText('2128', { x: margin, y, font, size: 9, color: black });

            let rightDetailsY = y + 70;
            page.drawText('Bank VAT Reg No 4320116074', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: gray });
            rightDetailsY -= 10;
            page.drawText('Lost cards 0800 110 929', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: gray });
            rightDetailsY -= 10;
            page.drawText('Client services 0860 555 111', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: gray });
            rightDetailsY -= 10;
            page.drawText('nedbank.co.za', { x: rightAddressX, y: rightDetailsY, font: boldFont, size: 8, color: primaryColor });
            rightDetailsY -= 12;
            page.drawLine({start: {x: rightAddressX, y: rightDetailsY+2}, end: {x: width - margin, y: rightDetailsY+2}, thickness: 0.5, color: gray})
            page.drawText('Tax invoice', { x: rightAddressX, y: rightDetailsY - 10, font, size: 8, color: gray });

            y -= 60;
            page.drawRectangle({ x: margin, y: y-50, width: width - margin*2, height: 50, color: primaryColor });
            page.drawText('Important message', { x: margin + 10, y: y-15, font: boldFont, size: 9, color: rgb(1,1,1) });
            page.drawText('From 28 February 2023, we will no longer send monthly investment statements by email or SMS.', { x: margin + 10, y: y-30, font, size: 8, color: rgb(1,1,1) });
            page.drawText("Visit www.nedbank.co.za/statement for more information.", { x: margin + 10, y: y-42, font, size: 8, color: rgb(1,1,1) });
            
            y -= 75;
            page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: margin, y, font, size: 7, color: gray });
            y -= 20;

            page.drawRectangle({ x: margin, y: y - 25, width: width - margin * 2, height: 25, color: primaryColor });
            page.drawText('Account summary', { x: margin + 10, y: y - 15, font: boldFont, size: 10, color: rgb(1,1,1) });
            
            y -= 35;
            page.drawRectangle({ x: margin, y: y - 25, width: width - margin * 2, height: 25, color: lightGray });
            page.drawText('Account type', { x: margin + 10, y: y - 15, font, size: 9, color: black });
            page.drawText('Account number', { x: width/2 + 10, y: y - 15, font, size: 9, color: black });

            y -= 30;
            page.drawText(account.name, { x: margin + 10, y, font: boldFont, size: 11, color: black });
            page.drawText(account.accountNumber, { x: width/2 + 10, y, font: boldFont, size: 11, color: black });

            y -= 15;
            page.drawLine({start: {x: margin, y}, end: {x: width-margin, y}, thickness: 0.5, color: lightGray})
            y -= 15;

            const summaryCol1 = margin + 10;
            const summaryCol2 = margin + 150;
            const summaryCol3 = width/2 + 10;
            const summaryCol4 = width/2 + 150;

            const firstTransactionDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].date) : new Date();

            page.drawText('Statement date:', { x: summaryCol1, y, font, size: 8 });
            page.drawText(format(new Date(), 'dd/MM/yyyy'), { x: summaryCol2, y, font, size: 8 });
            page.drawText('Envelope:', { x: summaryCol3, y, font, size: 8 });
            y-=12;
            page.drawText('Statement period:', { x: summaryCol1, y, font, size: 8 });
            page.drawText(`${format(firstTransactionDate, 'dd/MM/yyyy')} - ${format(new Date(), 'dd/MM/yyyy')}`, { x: summaryCol2, y, font, size: 8 });
            page.drawText('Total pages:', { x: summaryCol3, y, font, size: 8 });
            page.drawText('2', { x: summaryCol4, y, font, size: 8 });
             y-=12;
            page.drawText('Statement frequency:', { x: summaryCol1, y, font, size: 8 });
            page.drawText('Monthly', { x: summaryCol2, y, font, size: 8 });

            y -= 40;
            page.drawText('Bank charges summary', { x: margin, y, font: boldFont, size: 10, color: primaryColor });
            page.drawText('Cashflow', { x: width/2 + 10, y, font: boldFont, size: 10, color: primaryColor });
            y -= 15;
            page.drawLine({start: {x: margin, y}, end: {x: width-margin, y}, thickness: 1, color: lightGray})
            y -= 15;

            const formatCurrencyLocal = (val: number) => `R${val.toFixed(2)}`;

            page.drawText('Other charges', { x: margin, y, font, size: 8 });
            page.drawText(formatCurrencyLocal(0), { x: summaryCol2, y, font, size: 8, color: gray, xAlign: 'right', yAlign: 'center' });
            page.drawText('Opening balance', { x: summaryCol3, y, font, size: 8 });
            page.drawText(formatCurrencyLocal(openingBalance), { x: summaryCol4, y, font, size: 8, color: gray });
            y -= 12;
            page.drawText('Bank charge(s) (total)', { x: margin, y, font, size: 8 });
            page.drawText(formatCurrencyLocal(0), { x: summaryCol2, y, font, size: 8, color: gray, xAlign: 'right', yAlign: 'center' });
            page.drawText('Funds received/Credits', { x: summaryCol3, y, font, size: 8 });
            page.drawText(formatCurrencyLocal(totalCredits), { x: summaryCol4, y, font, size: 8, color: gray });
            y -= 12;
            page.drawText('"VAT inclusive @', { x: margin, y, font, size: 8 });
            page.drawText('15.000%', { x: summaryCol2, y, font, size: 8, color: gray, xAlign: 'right', yAlign: 'center' });
            page.drawText('Funds used/Debits', { x: summaryCol3, y, font, size: 8 });
            page.drawText(formatCurrencyLocal(totalDebits), { x: summaryCol4, y, font, size: 8, color: gray });
            y -= 12;
            page.drawText('VAT calculated monthly', { x: margin, y, font, size: 8 });
            page.drawText('Closing balance', { x: summaryCol3, y, font: boldFont, size: 8 });
            page.drawText(formatCurrencyLocal(closingBalance), { x: summaryCol4, y, font: boldFont, size: 8, color: gray });
            y -= 12;
            page.drawText('Annual credit interest rate', { x: summaryCol3, y, font, size: 8 });
            page.drawText('0.000%', { x: summaryCol4, y, font, size: 8, color: gray });

            y -= 40;
            const drawFinancialGraphs = (page: any, graphData: any) => {
                const START_X = margin;
                const CHART_WIDTH = 200;
                const BAR_HEIGHT = 8;
                const AXIS_HEIGHT = 60;
                let Y_START = y;
                const GAP_BETWEEN_CHARTS = 280;

                const FONT_SIZE = 8;
                
                const received = graphData.fundsReceived;
                const receivedTotal = received.totalCredits;
                const otherCreditsBarWidth = (receivedTotal > 0) ? (received.otherCredits / receivedTotal) * CHART_WIDTH : 0;

                page.drawText('Total funds received/credits', { x: START_X, y: Y_START, font: boldFont, size: 9 });
                page.drawText(`${formatCurrencyLocal(receivedTotal)}`, { x: START_X + 200, y: Y_START, font: boldFont, size: 9, color: primaryColor });
                
                Y_START -= 20;

                const Y_ROW_OTHER_CREDITS = Y_START;
                page.drawText('Other credits', { x: START_X, y: Y_ROW_OTHER_CREDITS, size: FONT_SIZE-1 });
                page.drawRectangle({ x: START_X, y: Y_ROW_OTHER_CREDITS - 10, width: otherCreditsBarWidth, height: BAR_HEIGHT, color: primaryColor });
                page.drawText(`${formatCurrencyLocal(received.otherCredits)}`, { x: START_X + 5, y: Y_ROW_OTHER_CREDITS - 10, size: FONT_SIZE-1, color: black });
                
                const Y_ROW_TOTAL_RECEIVED = Y_START - 20;
                page.drawText('Total', { x: START_X, y: Y_ROW_TOTAL_RECEIVED, size: FONT_SIZE-1 });
                page.drawRectangle({ x: START_X, y: Y_ROW_TOTAL_RECEIVED - 10, width: CHART_WIDTH, height: BAR_HEIGHT, color: primaryColor });
                page.drawText(`${formatCurrencyLocal(receivedTotal)}`, { x: START_X + CHART_WIDTH + 5, y: Y_ROW_TOTAL_RECEIVED-10, size: FONT_SIZE-1, color: black });
                
                Y_START -= 50;

                for (let i = 0; i <= 100; i += 10) {
                    const x_label = START_X + (i / 100) * CHART_WIDTH;
                    page.drawLine({start: {x: x_label, y: Y_START+12}, end: {x: x_label, y: Y_START+8}, thickness: 0.5, color: gray});
                    page.drawText(i.toString(), { x: x_label - 5, y: Y_START, size: FONT_SIZE-2 });
                }
                page.drawLine({start: {x: START_X, y: Y_START+10}, end: {x: START_X + CHART_WIDTH, y: Y_START+10}, thickness: 0.5, color: gray});

                page.drawText('% of funds received', { x: START_X + CHART_WIDTH / 2 - 40, y: Y_START - 15, size: FONT_SIZE-2 });
                
                // RIGHT GRAPH
                const used = graphData.fundsUsed;
                const usedTotal = used.totalDebits;
                const totalChargesAndFees = used.totalChargesAndFees;
                const otherDebits = used.otherDebits;
                const chargesBarWidth = (usedTotal > 0) ? (totalChargesAndFees / usedTotal) * CHART_WIDTH : 0;
                const otherDebitsBarWidth = (usedTotal > 0) ? (otherDebits / usedTotal) * CHART_WIDTH : 0;
                const CHART_START_X = START_X + GAP_BETWEEN_CHARTS;

                Y_START = y; // Reset Y for the second chart
                page.drawText('Total funds used/debits', { x: CHART_START_X - 40, y: Y_START, font: boldFont, size: 9 });
                page.drawText(`${formatCurrencyLocal(usedTotal)}`, { x: CHART_START_X + 200, y: Y_START, font: boldFont, size: 9, color: primaryColor });

                Y_START -= 20;

                const Y_ROW_CHARGES = Y_START;
                page.drawText('Total charges and fees', { x: CHART_START_X-40, y: Y_ROW_CHARGES, size: FONT_SIZE-1 });
                page.drawRectangle({ x: CHART_START_X, y: Y_ROW_CHARGES - 10, width: chargesBarWidth, height: BAR_HEIGHT, color: primaryColor });
                page.drawText(`${formatCurrencyLocal(totalChargesAndFees)}`, { x: CHART_START_X + CHART_WIDTH + 5, y: Y_ROW_CHARGES-10, size: FONT_SIZE-1 });

                const Y_ROW_OTHER_DEBITS = Y_START - 20;
                page.drawText('Other debits', { x: CHART_START_X-40, y: Y_ROW_OTHER_DEBITS, size: FONT_SIZE-1 });
                page.drawRectangle({ x: CHART_START_X, y: Y_ROW_OTHER_DEBITS - 10, width: otherDebitsBarWidth, height: BAR_HEIGHT, color: primaryColor });
                page.drawText(`${formatCurrencyLocal(otherDebits)}`, { x: CHART_START_X + 5, y: Y_ROW_OTHER_DEBITS - 10, size: FONT_SIZE-1 });
                
                const Y_ROW_TOTAL_USED = Y_START - 40;
                page.drawText('Total', { x: CHART_START_X - 40, y: Y_ROW_TOTAL_USED, size: FONT_SIZE-1 });
                page.drawRectangle({ x: CHART_START_X, y: Y_ROW_TOTAL_USED-10, width: CHART_WIDTH, height: BAR_HEIGHT, color: primaryColor });
                page.drawText(`${formatCurrencyLocal(usedTotal)}`, { x: CHART_START_X + CHART_WIDTH + 5, y: Y_ROW_TOTAL_USED-10, size: FONT_SIZE-1 });
                
                Y_START -= 70;
                
                for (let i = 0; i <= 100; i += 10) {
                    const x_label = CHART_START_X + (i / 100) * CHART_WIDTH;
                    page.drawLine({start: {x: x_label, y: Y_START+12}, end: {x: x_label, y: Y_START+8}, thickness: 0.5, color: gray});
                    page.drawText(i.toString(), { x: x_label - 5, y: Y_START, size: FONT_SIZE-2 });
                }
                page.drawLine({start: {x: CHART_START_X, y: Y_START+10}, end: {x: CHART_START_X + CHART_WIDTH, y: Y_START+10}, thickness: 0.5, color: gray});
                page.drawText('% of utilisation', { x: CHART_START_X + CHART_WIDTH / 2 - 30, y: Y_START - 15, size: FONT_SIZE-2 });
            };

            drawFinancialGraphs(page, {
                fundsReceived: { totalCredits: totalCredits, otherCredits: totalCredits },
                fundsUsed: { totalDebits: totalDebits, totalChargesAndFees: 0, otherDebits: totalDebits }
            });

            // Footer
            y = 100;
            page.drawText('see money differently', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
            const footerTextX = width / 2;
            const footerText = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. Authorised financial services and registered credit provider (NCRCP16). Nedbank Ltd Reg No 1951/000009/06.';
            const footerLines = footerText.split('. ');
            let currentFooterY = y;
            footerLines.forEach(line => {
                page.drawText(line + (line.endsWith('.') ? '' : '.'), { x: footerTextX, y: currentFooterY, font, size: 6, color: gray, maxWidth: width/2 - margin });
                currentFooterY -= 7;
            })
            page.drawText('Page 1 of 2', {x: width - margin - 50, y: y-10, font: boldFont, size: 8});

            // --- Transactions Page (Page 2) ---
            let txPage: any = page;
            let pageCount = 1;
            let txPageY = 0; // Will be set after first page is finalized

            const addPageHeader = (p: any, pageNum: number) => {
                const {width, height} = p.getSize();
                p.drawImage(eConfirmImage, { x: margin, y: height - 60, width: 80, height: 40 });
                p.drawImage(nLogoImage, { x: width - margin - 50, y: height - 46, width: 50, height: 26 });
                p.drawText('STATEMENT', { x: width - margin - 150, y: height - 80, font: boldFont, size: 16, color: black });
                p.drawText(account.name, { x: width - margin - 200, y: height - 100, font: font, size: 10, color: gray });
                p.drawText(`Page ${pageNum} of 2`, { x: width - margin - 100, y: height - 115, font, size: 8, color: gray });
            }
            
            const addPageFooter = (p: any) => {
                 const {width} = p.getSize();
                 p.drawText('see money differently', { x: (width / 2) - 50, y: margin, font: boldFont, size: 10, color: primaryColor });
            }
            
            txPage = pdfDoc.addPage(PageSizes.A4);
            pageCount++;
            addPageHeader(txPage, pageCount);

            txPageY = txPage.getSize().height - 150;
            
            const colWidths = [80, 215, 80, 80, 80];
            const headers = ['Date', 'Description', `Debits(${account.currency})`, `Credits(${account.currency})`, `Balance(${account.currency})`];
            
            txPage.drawRectangle({ x: margin, y: txPageY - 22, width: width - margin * 2, height: 22, color: primaryColor });
            let currentX = margin + 5;
            headers.forEach((header, i) => {
                txPage.drawText(header, { x: currentX, y: txPageY - 15, font: boldFont, size: 9, color: rgb(1, 1, 1) });
                currentX += colWidths[i];
            });
            txPageY -= 30;
            
            const drawRow = (p:any, yPos:number, rowData: string[], isHeader = false) => {
                 let xPos = margin + 5;
                 rowData.forEach((cell, i) => {
                    const fontToUse = isHeader || i === 4 ? boldFont : font;
                    let cellColor = black;
                    if(i === 2) cellColor = red;
                    if(i === 3) cellColor = green;

                    p.drawText(cell, { x: xPos, y: yPos, font: fontToUse, size: 9, color: cellColor });
                    xPos += colWidths[i];
                 });
            }

            drawRow(txPage, txPageY, [
                format(firstTransactionDate, 'dd/MM/yyyy'),
                'Opening Balance',
                '',
                '',
                formatCurrencyLocal(openingBalance)
            ], true);
            txPageY -= 20;

            let currentBalance = openingBalance;
            for (const tx of sortedTransactions) {
                 if (txPageY < margin + 40) {
                    addPageFooter(txPage);
                    txPage = pdfDoc.addPage(PageSizes.A4);
                    pageCount++;
                    addPageHeader(txPage, pageCount);
                    txPageY = height - 150;
                 }
                currentBalance = tx.type === 'credit' ? currentBalance + tx.amount : currentBalance - tx.amount;
                const rowData = [
                    format(new Date(tx.date), 'dd/MM/yyyy'),
                    tx.description.substring(0, 35),
                    tx.type === 'debit' ? formatCurrencyLocal(tx.amount) : '',
                    tx.type === 'credit' ? formatCurrencyLocal(tx.amount) : '',
                    formatCurrencyLocal(currentBalance)
                ];
                drawRow(txPage, txPageY, rowData);
                txPageY -= 20;
            }
            addPageFooter(txPage);

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
                {!isLoading && !error && account && sortedTransactions.length > 0 && userData && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementSummaryPage 
                            account={account} 
                            user={userData}
                            openingBalance={openingBalance}
                            closingBalance={closingBalance}
                            totalCredits={totalCredits}
                            totalDebits={totalDebits}
                        />
                        <StatementTransactionsPage account={account} transactions={sortedTransactions} openingBalance={openingBalance} />
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
