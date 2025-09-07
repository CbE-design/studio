'use server';
/**
 * @fileOverview Generates a Statement PDF document using pdf-lib, matching a specific Nedbank design.
 *
 * - generateStatementPdf - Creates a PDF from account and transaction details.
 * - GenerateStatementPdfInput - The input type for the function.
 * - GenerateStatementPdfOutput - The return type for the function (PDF as base64).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts, PageSizes, grayscale } from 'pdf-lib';

const TransactionSchema = z.object({
  id: z.string().optional(),
  timestamp: z.any().describe("Can be a Date object or a Firestore Timestamp-like object with seconds."),
  description: z.string(),
  amount: z.string(),
});

const GenerateStatementPdfInputSchema = z.object({
  accountName: z.string(),
  transactions: z.array(TransactionSchema),
  balance: z.number(),
});
export type GenerateStatementPdfInput = z.infer<typeof GenerateStatementPdfInputSchema>;

const GenerateStatementPdfOutputSchema = z.object({
  pdfBase64: z.string().describe('The generated PDF document, encoded in base64.'),
});
export type GenerateStatementPdfOutput = z.infer<typeof GenerateStatementPdfOutputSchema>;


export async function generateStatementPdf(input: GenerateStatementPdfInput): Promise<GenerateStatementPdfOutput> {
  return generateStatementPdfFlow(input);
}

// Helper to format currency
const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value.toString().replace(/[^0-9.-]+/g,"")) : value;
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


const generateStatementPdfFlow = ai.defineFlow(
  {
    name: 'generateStatementPdfFlow',
    inputSchema: GenerateStatementPdfInputSchema,
    outputSchema: GenerateStatementPdfOutputSchema,
  },
  async ({ accountName, transactions, balance }) => {
    const sortedTransactions = [...transactions]
        .map(tx => ({...tx, timestamp: tx.timestamp.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp)}))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let openingBalance = balance;
    let fundsReceived = 0;
    let fundsUsed = 0;
    let totalFees = 0;

    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        openingBalance -= amount;
    }

    let runningBalance = openingBalance;
    const finalTransactions = sortedTransactions.map(tx => {
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        runningBalance += amount;
        if (tx.description.toLowerCase().includes('fee:')) {
            totalFees += Math.abs(amount);
        }
        if (amount > 0) {
            fundsReceived += amount;
        } else {
            fundsUsed += Math.abs(amount);
        }
        return { ...tx, balance: runningBalance, amount };
    });
    
    const statementPeriod = sortedTransactions.length > 0
        ? `${formatDate(new Date(sortedTransactions[0].timestamp))} - ${formatDate(new Date(sortedTransactions[sortedTransactions.length - 1].timestamp))}`
        : "N/A";
    
    const statementDate = sortedTransactions.length > 0 
        ? formatDate(new Date(sortedTransactions[sortedTransactions.length - 1].timestamp))
        : formatDate(new Date());


    // PDF Generation
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed the logos
    const logoUrl = 'https://i.ibb.co/Ldn0sRk/nedbank-logo.png';
    const logoImageBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const logoDims = logoImage.scale(0.05);

    const mainLogoUrl = 'https://i.ibb.co/28SpD9k/nedbank-main-logo.png';
    const mainLogoImageBytes = await fetch(mainLogoUrl).then((res) => res.arrayBuffer());
    const mainLogoImage = await pdfDoc.embedPng(mainLogoImageBytes);
    const mainLogoDims = mainLogoImage.scale(0.08);

    const primaryColor = rgb(0 / 255, 112 / 255, 60 / 255); // Nedbank Green
    const black = rgb(0, 0, 0);
    const white = rgb(1,1,1);
    const gray = grayscale(0.5);

    let y = height - 40;
    const margin = 50;
    const rightColX = width / 2 + 20;

    // 1. Header Section
    // eConfirm Box
    page.drawRectangle({x: margin, y: y - 28, width: 95, height: 40, borderColor: black, borderWidth: 1});
    page.drawImage(logoImage, { x: margin + 2, y: y - 18, width: logoDims.width, height: logoDims.height });
    page.drawText('eConfirm', { x: margin + 18, y: y + 2, font: boldFont, size: 10 });
    page.drawText(statementDate, { x: margin + 15, y: y - 22, font, size: 8 });

    // Main Logo and Bank Address
    page.drawImage(mainLogoImage, { x: width - margin - mainLogoDims.width, y: y - 10, width: mainLogoDims.width, height: mainLogoDims.height });
    y -= 55;
    const bankAddressY = y;
    page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightColX, y: bankAddressY, font, size: 9 });
    page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightColX, y: bankAddressY - 12, font, size: 9 });
    
    // Client Address
    const clientAddress = [
        'VAN SCHALKWYK FAMILY TRUST',
        'PO BOX 1234',
        'SANDTON',
        'GAUTENG',
        '2196'
    ];
    clientAddress.forEach((line, index) => {
        page.drawText(line, { x: margin, y: y - (index * 12), font: boldFont, size: 9 });
    });

    y -= 45;

    page.drawText('Bank VAT Reg No. 4320116074', { x: rightColX, y: y, font, size: 9 });
    page.drawText('Lost cards 0800 110 929', { x: rightColX, y: y - 12, font, size: 9 });
    page.drawText('Client services 0860 555 111', { x: rightColX, y: y - 24, font, size: 9 });
    page.drawText('nedbank.co.za', { x: rightColX, y: y - 36, font, size: 9 });
    
    y -= 50;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: black });
    page.drawText('Computer-generated tax invoice', { x: width/2 - 60, y: y - 12, font: boldFont, size: 9 });
    y -= 25;

    // 2. Notification Box
    page.drawRectangle({x: margin, y: y - 45, width: width - (margin * 2), height: 50, color: primaryColor});
    page.drawText('CERTAIN CHEQUE SERVICES WILL NO LONGER BE AVAILABLE FROM', { x: margin + 10, y: y - 15, font: boldFont, size: 12, color: white });
    page.drawText('1 SEPTEMBER 2020.', { x: margin + 10, y: y - 30, font: boldFont, size: 12, color: white });
    page.drawText('PLEASE VISIT NEDBANK.CO.ZA FOR MORE INFORMATION.', { x: width - margin - 250, y: y - 30, font: boldFont, size: 9, color: white });
    y-= 50;

    page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: margin, y, font, size: 6 });
    y -= 15;

    // 3. Account Summary
    page.drawText('Account summary', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
    y -= 5;
    page.drawRectangle({x: margin, y: y - 20, width: width - (margin * 2), height: 20, color: primaryColor});
    page.drawText('Account type', { x: margin + 5, y: y-15, font: boldFont, size: 9, color: white });
    page.drawText('Account number', { x: rightColX, y: y-15, font: boldFont, size: 9, color: white });
    y -= 35;
    page.drawText(accountName, { x: margin + 5, y, font, size: 9 });
    page.drawText('...8027', { x: rightColX, y, font, size: 9 });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: gray });
    y -= 15;
    
    const summaryDetails = [
        { labelLeft: 'Statement date:', valueLeft: statementDate, labelRight: 'Envelope:', valueRight: '1 of 1' },
        { labelLeft: 'Statement period:', valueLeft: statementPeriod, labelRight: 'Total pages:', valueRight: '1' },
        { labelLeft: 'Statement frequency:', valueLeft: 'Monthly', labelRight: 'Client VAT number:', valueRight: 'N/A' },
    ];
    summaryDetails.forEach(detail => {
        page.drawText(detail.labelLeft, { x: margin + 5, y, font, size: 9 });
        page.drawText(detail.valueLeft, { x: margin + 100, y, font: boldFont, size: 9 });
        page.drawText(detail.labelRight, { x: rightColX, y, font, size: 9 });
        page.drawText(detail.valueRight, { x: rightColX + 100, y, font: boldFont, size: 9 });
        y -= 12;
    });
    y -= 15;

    // 4. Bank Charges & Cashflow
    const chargesLeftCol = margin + 5;
    const chargesRightCol = margin + 150;
    const cashflowLeftCol = rightColX;
    const cashflowRightCol = rightColX + 150;

    page.drawText('Bank charges summary', { x: chargesLeftCol, y, font: boldFont, size: 11, color: primaryColor });
    page.drawText('Cashflow', { x: cashflowLeftCol, y, font: boldFont, size: 11, color: primaryColor });
    y -= 20;

    const bankChargesData = [
        { label: 'Electronic banking fees', value: formatCurrency(totalFees) },
        { label: 'Initiation fee', value: '0.00' },
        { label: 'Transaction service fees', value: '0.00' },
        { label: 'Other charges', value: '0.00' },
        { label: 'Bank charge(s) (total)', value: formatCurrency(totalFees) },
        { label: 'VAT inclusive @', value: '15.000%' },
    ];

    const cashflowData = [
        { label: 'Opening balance', value: formatCurrency(openingBalance) },
        { label: 'Funds received/Credits', value: formatCurrency(fundsReceived) },
        { label: 'Funds used/Debits', value: formatCurrency(fundsUsed) },
        { label: 'Closing balance', value: formatCurrency(runningBalance) },
        { label: 'Annual credit interest rate', value: '0.000%' },
    ];
    
    const rows = Math.max(bankChargesData.length, cashflowData.length);
    for (let i = 0; i < rows; i++) {
        if (bankChargesData[i]) {
            page.drawText(bankChargesData[i].label, { x: chargesLeftCol, y, font, size: 9 });
            page.drawText(`R${bankChargesData[i].value}`, { x: chargesRightCol, y, font: font, size: 9, color: black });
        }
        if (cashflowData[i]) {
            page.drawText(cashflowData[i].label, { x: cashflowLeftCol, y, font, size: 9 });
            page.drawText(`R${cashflowData[i].value}`, { x: cashflowRightCol, y, font: font, size: 9, color: black });
        }
        y -= 15;
    }

    y -= 30;

    // Transactions Table
    page.drawText('Transactions', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
    y -= 15;

    const transTableTopY = y;
    const transCol1X = margin;       // Date
    const transCol2X = transCol1X + 80;  // Description
    const transCol3X = transCol2X + 220; // Debits
    const transCol4X = transCol3X + 80;  // Credits
    const transCol5X = transCol4X + 80;  // Balance
    const tableWidth = width - (margin * 2);

    page.drawRectangle({x: margin, y: transTableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('Date', {x: transCol1X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Description', {x: transCol2X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Debits(R)', {x: transCol3X + 5, y: transTableTopY, color: white, font: boldFont, size: 9, textAlign: 'right'});
    page.drawText('Credits(R)', {x: transCol4X + 5, y: transTableTopY, color: white, font: boldFont, size: 9, textAlign: 'right'});
    page.drawText('Balance(R)', {x: transCol5X + 5, y: transTableTopY, color: white, font: boldFont, size: 9, textAlign: 'right'});
    y -= 25;

    // Opening Balance Row
    page.drawText(sortedTransactions.length > 0 ? formatDate(new Date(sortedTransactions[0].timestamp)) : '-', { x: transCol1X + 5, y, font, size: 9 });
    page.drawText('Opening balance', { x: transCol2X + 5, y, font: boldFont, size: 9 });
    page.drawText(formatCurrency(openingBalance), { x: transCol5X + tableWidth - (transCol5X+5), y, font, size: 9, textAlign: 'right' });
    y -= 15;

    // Transaction Rows
    finalTransactions.forEach(tx => {
        if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        page.drawText(formatDate(new Date(tx.timestamp)), { x: transCol1X + 5, y, font, size: 9 });
        page.drawText(tx.description.substring(0, 40), { x: transCol2X + 5, y, font, size: 9 });
        
        if (tx.amount < 0) {
            page.drawText(formatCurrency(Math.abs(tx.amount)), { x: transCol3X + 70, y, font, size: 9, textAlign: 'right' });
        } else {
            page.drawText(formatCurrency(tx.amount), { x: transCol4X + 70, y, font, size: 9, textAlign: 'right' });
        }
        
        page.drawText(formatCurrency(tx.balance), { x: transCol5X + 70, y, font, size: 9, textAlign: 'right' });
        y -= 15;
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
