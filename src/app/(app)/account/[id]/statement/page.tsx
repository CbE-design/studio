
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

const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-96 w-full mt-4" />
  </div>
);

const StatementTransactionsPage = ({ account, transactions, openingBalance }: { account: Account, transactions: Transaction[], openingBalance: number }) => {
    
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
                            <td className="p-2">{transactions.length > 0 ? format(new Date(transactions[0]?.date || new Date()), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</td>
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
                try { return await pdfDoc.embedPng(imageBytes); } 
                catch (pngError) {
                    try { return await pdfDoc.embedJpg(imageBytes); } 
                    catch (jpgError) {
                        console.error("Failed to embed image as PNG or JPG", { pngError, jpgError });
                        throw new Error("Unsupported image format. Please use PNG or JPEG.");
                    }
                }
            };

            const primaryColor = rgb(0, 0.447, 0.243); // #00723E
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
            const nLogoDims = nLogoImage.scale(0.35);
            const eConfirmImage = await embedImage(eConfirmBytes);
            const barcodeImage = await embedImage(barcodeBytes);
            
            const totalPages = Math.ceil(sortedTransactions.length / 30) + 1; // 30 rows per page + 1 summary page
            
            // --- Summary Page (Page 1) ---
            let page = pdfDoc.addPage(PageSizes.A4);
            let { width, height } = page.getSize();
            const margin = 40;
            let y = height - margin;

            // Header
            page.drawImage(eConfirmImage, { x: margin, y: y - 30, width: 80, height: 40 });
            page.drawImage(nLogoImage, { x: width - margin - nLogoDims.width, y: y - nLogoDims.height, width: nLogoDims.width, height: nLogoDims.height });
            y -= 80;

            // Barcode and Right-side addresses
            page.drawImage(barcodeImage, { x: margin, y: y, width: 250, height: 20 });
            const rightAddressX = width - margin - 200;
            page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightAddressX, y: y + 25, font, size: 8, color: gray });
            page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightAddressX, y: y + 15, font, size: 8, color: gray });

            // Left-side address (Payer)
            y -= 20;
            let leftY = y;
            page.drawText('Mr', { x: margin, y: leftY, font, size: 9, color: black });
            leftY -= 12;
            page.drawText((userData.firstName || 'UNDEFINED' + ' ' + (userData.lastName || 'UNDEFINED')).toUpperCase(), { x: margin, y: leftY, font: boldFont, size: 9, color: black });
            leftY -= 12;
            page.drawText(account.name.toUpperCase(), { x: margin, y: leftY, font: boldFont, size: 9, color: black });
            leftY -= 24;
            page.drawText('PO BOX 135', { x: margin, y: leftY, font, size: 9, color: black });
            leftY -= 12;
            page.drawText('RIVONIA', { x: margin, y: leftY, font, size: 9, color: black });
            leftY -= 12;
            page.drawText('JOHANNESBURG', { x: margin, y: leftY, font, size: 9, color: black });
            leftY -= 12;
            page.drawText('2128', { x: margin, y: leftY, font, size: 9, color: black });

            // Right-side details
            let rightDetailsY = y;
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

            y = leftY - 30;

            // Important Message Box
            page.drawRectangle({ x: margin, y: y - 50, width: width - margin*2, height: 50, color: primaryColor });
            page.drawText('Important message', { x: margin + 10, y: y - 15, font: boldFont, size: 9, color: rgb(1,1,1) });
            page.drawText('From 28 February 2023, we will no longer send monthly investment statements by email or SMS.', { x: margin + 10, y: y-30, font, size: 8, color: rgb(1,1,1) });
            page.drawText("Visit www.nedbank.co.za/statement for more information.", { x: margin + 10, y: y-42, font, size: 8, color: rgb(1,1,1) });
            
            y -= 75;
            page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: margin, y, font, size: 7, color: gray });
            y -= 20;

            // Account Summary Box
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

            // Statement details
            const firstTransactionDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].date) : new Date();
            const statementPeriod = `${format(firstTransactionDate, 'dd/MM/yyyy')} - ${format(new Date(), 'dd/MM/yyyy')}`;
            const summaryCol1 = margin + 10;
            const summaryCol2 = margin + 150;
            page.drawText('Statement date:', { x: summaryCol1, y, font, size: 8 });
            page.drawText(format(new Date(), 'dd/MM/yyyy'), { x: summaryCol2, y, font, size: 8 });
            page.drawText('Envelope:', { x: width/2 + 10, y, font, size: 8 });
            y-=12;
            page.drawText('Statement period:', { x: summaryCol1, y, font, size: 8 });
            page.drawText(statementPeriod, { x: summaryCol2, y, font, size: 8 });
            page.drawText('Total pages:', { x: width/2 + 10, y, font, size: 8 });
            page.drawText(totalPages.toString(), { x: width/2 + 150, y, font, size: 8 });
            y-=12;
            page.drawText('Statement frequency:', { x: summaryCol1, y, font, size: 8 });
            page.drawText('Monthly', { x: summaryCol2, y, font, size: 8 });

            y -= 40;
            page.drawText('Bank charges summary', { x: margin, y, font: boldFont, size: 10, color: primaryColor });
            page.drawText('Cashflow', { x: width/2 + 10, y, font: boldFont, size: 10, color: primaryColor });
            y -= 15;
            page.drawLine({start: {x: margin, y}, end: {x: width-margin, y}, thickness: 1, color: lightGray})
            y -= 15;
            
            // Charges and Cashflow tables
            const formatR = (val: number) => `R${val.toFixed(2)}`;
            const chargesCol1 = margin;
            const chargesCol2 = margin + 150;
            let chargesY = y;
            page.drawText('Other charges', { x: chargesCol1, y: chargesY, font, size: 8 });
            page.drawText(formatR(0), { x: chargesCol2, y: chargesY, font, size: 8, color: gray});
            chargesY -= 12;
            page.drawText('Bank charge(s) (total)', { x: chargesCol1, y: chargesY, font, size: 8 });
            page.drawText(formatR(0), { x: chargesCol2, y: chargesY, font, size: 8, color: gray});
            chargesY -= 12;
            page.drawText('"VAT inclusive @', { x: chargesCol1, y: chargesY, font, size: 8 });
            page.drawText('15.000%', { x: chargesCol2, y: chargesY, font, size: 8, color: gray });
            chargesY -= 12;
            page.drawText('VAT calculated monthly', { x: chargesCol1, y: chargesY, font, size: 8 });
            
            const cashflowCol1 = width/2 + 10;
            const cashflowCol2 = width - margin - 50; // Right align this column
            let cashflowY = y;
            page.drawText('Opening balance', { x: cashflowCol1, y: cashflowY, font, size: 8 });
            page.drawText(formatR(openingBalance), { x: cashflowCol2, y: cashflowY, font, size: 8, color: gray, align: 'right' });
            cashflowY -= 12;
            page.drawText('Funds received/Credits', { x: cashflowCol1, y: cashflowY, font, size: 8 });
            page.drawText(formatR(totalCredits), { x: cashflowCol2, y: cashflowY, font, size: 8, color: gray, align: 'right' });
            cashflowY -= 12;
            page.drawText('Funds used/Debits', { x: cashflowCol1, y: cashflowY, font, size: 8 });
            page.drawText(formatR(totalDebits), { x: cashflowCol2, y: cashflowY, font, size: 8, color: gray, align: 'right' });
            cashflowY -= 12;
            page.drawText('Closing balance', { x: cashflowCol1, y: cashflowY, font: boldFont, size: 8 });
            page.drawText(formatR(closingBalance), { x: cashflowCol2, y: cashflowY, font: boldFont, size: 8, color: gray, align: 'right' });
            cashflowY -= 12;
            page.drawText('Annual credit interest rate', { x: cashflowCol1, y: cashflowY, font, size: 8 });
            page.drawText('0.000%', { x: cashflowCol2, y: cashflowY, font, size: 8, color: gray, align: 'right' });

            y = Math.min(chargesY, cashflowY) - 40; // Position below the taller column

            // --- Footer ---
            y = margin + 60;
            page.drawText('see money differently', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
            const footerText = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. Authorised financial services and registered credit provider (NCRCP16). Nedbank Ltd Reg No 1951/000009/06.';
            const footerLines = footerText.split('. ');
            let currentFooterY = y - 20;
            const footerTextX = width / 2 - 20;
            footerLines.forEach(line => {
                if (!line) return;
                page.drawText(line + (line.endsWith('.') ? '' : '.'), { x: footerTextX, y: currentFooterY, font, size: 6, color: gray, maxWidth: width/2 - margin + 20, lineHeight: 7 });
                currentFooterY -= 14;
            })
            page.drawText(`Page 1 of ${totalPages}`, {x: width - margin - 50, y: margin, font: boldFont, size: 8});

            // --- Transactions Page(s) ---
            const addPageHeader = (p: any, pageNum: number, total: number) => {
                const { width, height } = p.getSize();
                p.drawImage(eConfirmImage, { x: margin, y: height - 60, width: 80, height: 40 });
                p.drawImage(nLogoImage, { x: width - margin - nLogoDims.width, y: height - 55, width: nLogoDims.width, height: nLogoDims.height });
                p.drawText('STATEMENT', { x: (width / 2) - 30, y: height - 50, font: boldFont, size: 14, color: black });
                p.drawText(`${account.name} - ${account.accountNumber}`, { x: margin, y: height - 80, font, size: 10, color: gray });
                p.drawText(`Page ${pageNum} of ${total}`, { x: width - margin - 60, y: height - 80, font, size: 8, color: gray });
            }
            
            const addPageFooter = (p: any) => {
                 const {width} = p.getSize();
                 p.drawText('see money differently', { x: (width / 2) - 50, y: margin, font: boldFont, size: 10, color: primaryColor });
            }
            
            let pageCount = 2;
            let txPage = pdfDoc.addPage(PageSizes.A4);
            addPageHeader(txPage, pageCount, totalPages);

            let txPageY = txPage.getSize().height - 110;
            
            const colWidths = [80, 200, 80, 80, 80];
            const headers = ['Date', 'Description', `Debits(${account.currency})`, `Credits(${account.currency})`, `Balance(${account.currency})`];
            
            txPage.drawRectangle({ x: margin, y: txPageY - 20, width: width - margin * 2, height: 20, color: primaryColor });
            let currentX = margin + 5;
            headers.forEach((header, i) => {
                let xPos = currentX;
                if(i >= 2) { // Right-align Debits, Credits, Balance headers
                    const textWidth = boldFont.widthOfTextAtSize(header, 9);
                    xPos = currentX + colWidths[i] - textWidth - 5;
                }
                txPage.drawText(header, { x: xPos, y: txPageY - 14, font: boldFont, size: 9, color: rgb(1, 1, 1) });
                currentX += colWidths[i];
            });
            txPageY -= 30;
            
            const drawRow = (p: any, yPos: number, rowData: string[], isHeader = false) => {
                 let xPos = margin + 5;
                 rowData.forEach((cell, i) => {
                    const fontToUse = isHeader || i === 4 ? boldFont : font;
                    let cellColor = i === 2 ? red : i === 3 ? green : black;
                    if(isHeader) cellColor = black;
                    
                    let calculatedX = xPos;
                    if(i >= 2) { // Right align numeric columns
                        const textWidth = fontToUse.widthOfTextAtSize(cell, 9);
                        calculatedX = xPos + colWidths[i] - textWidth - 5;
                    }

                    p.drawText(cell, { x: calculatedX, y: yPos, font: fontToUse, size: 9, color: cellColor });
                    xPos += colWidths[i];
                 });
                 p.drawLine({ start: { x: margin, y: yPos - 5 }, end: { x: width - margin, y: yPos - 5 }, thickness: 0.5, color: lightGray });
            }

            drawRow(txPage, txPageY, [
                format(firstTransactionDate, 'dd/MM/yyyy'),
                'Opening Balance',
                '',
                '',
                formatCurrency(openingBalance)
            ], true);
            txPageY -= 20;

            let currentBalance = openingBalance;
            for (const tx of sortedTransactions) {
                 if (txPageY < margin + 40) {
                    addPageFooter(txPage);
                    txPage = pdfDoc.addPage(PageSizes.A4);
                    pageCount++;
                    addPageHeader(txPage, pageCount, totalPages);
                    txPageY = txPage.getSize().height - 110;
                 }
                currentBalance = tx.type === 'credit' ? currentBalance + tx.amount : currentBalance - tx.amount;
                const rowData = [
                    format(new Date(tx.date), 'dd/MM/yyyy'),
                    tx.description.substring(0, 35),
                    tx.type === 'debit' ? formatCurrency(tx.amount) : '',
                    tx.type === 'credit' ? formatCurrency(tx.amount) : '',
                    formatCurrency(currentBalance)
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

    