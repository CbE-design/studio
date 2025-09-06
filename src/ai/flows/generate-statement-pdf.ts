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
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

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
const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0.00';
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
    // Calculate opening balance by reverse-summing transactions from the closing balance
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        openingBalance -= amount;
    }

    let totalDebits = 0;
    let totalCredits = 0;
    let totalFees = 0;
    
    let runningBalance = openingBalance;
    const finalTransactions = sortedTransactions.map(tx => {
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        runningBalance += amount;
        if (amount < 0) {
            totalDebits += Math.abs(amount);
             if (tx.description.toLowerCase().includes('fee:')) {
                totalFees += Math.abs(amount);
            }
        } else {
            totalCredits += amount;
        }
        return { ...tx, balance: runningBalance, amount: amount };
    });

    const closingBalance = runningBalance;
    const vatOnFees = totalFees * (15 / 115);
    
    const statementPeriod = sortedTransactions.length > 0
        ? `${new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB')} - ${new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).toLocaleDateString('en-GB')}`
        : "N/A";

    // PDF Generation
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const primaryColor = rgb(0 / 255, 112 / 255, 60 / 255); // Nedbank Green
    const grayColor = rgb(0.3, 0.3, 0.3);
    const black = rgb(0, 0, 0);

    let y = height - 40;
    const margin = 50;
    
    // 1. Header
    // Top Left
    page.drawText('NEDBANK', { x: margin, y, font: boldFont, size: 14, color: primaryColor });
    y -= 10;
    page.drawText('Reg No 1951/000009/06', { x: margin, y, font, size: 8 });
    
    // eConfirm Box
    y += 5;
    const eConfirmBoxWidth = 80;
    page.drawRectangle({x: margin + eConfirmBoxWidth + 10, y: y-12, width: eConfirmBoxWidth, height: 30, borderColor: black, borderWidth: 1});
    page.drawText('eConfirm', { x: margin + eConfirmBoxWidth + 28, y: y + 5, font: boldFont, size: 10 });
    page.drawText(new Date().toLocaleDateString('en-GB'), { x: margin + eConfirmBoxWidth + 25, y: y - 5, font, size: 8 });

    // Top Right
    const rightColX = width - margin - 150;
    let yRight = height - 40;
    page.drawText('NEDBANK', { x: rightColX + 100, y: yRight, font: boldFont, size: 14, color: primaryColor });
    yRight -= 20;
    page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightColX, y: yRight, font, size: 8 });
    yRight -= 10;
    page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightColX, y: yRight, font, size: 8 });
    yRight -= 15;
    page.drawText('Bank VAT Reg No. 4320116074', { x: rightColX, y: yRight, font, size: 8 });
    yRight -= 10;
    page.drawText('Lost cards 0800 110 929', { x: rightColX, y: yRight, font, size: 8 });
    yRight -= 10;
    page.drawText('Client services 0860 555 111', { x: rightColX, y: yRight, font, size: 8 });
    yRight -= 10;
    page.drawText('nedbank.co.za', { x: rightColX, y: yRight, font, size: 8 });
    
    // User Address
    y = height - 100;
    page.drawText("VAN SCHALKWYK FAMILY TRUST", { x: margin, y, font, size: 10 });
    y -= 12;
    page.drawText("PO BOX 1234", { x: margin, y, font, size: 10 });
    y -= 12;
    page.drawText("SANDTON, GAUTENG, 2196", { x: margin, y, font, size: 10 });
    
    y -= 25;
    // Computer Generated Invoice Line
    const textWidth = boldFont.widthOfTextAtSize('Computer-generated tax invoice', 10);
    page.drawText('Computer-generated tax invoice', { x: width - margin - textWidth, y: y, font: boldFont, size: 10 });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: black });

    y -= 40; // Space for the green banner if needed in future, now just space

    // 2. Account Summary
    page.drawText('Account summary', { x: margin, y, font: boldFont, size: 12 });
    y -= 15;
    page.drawRectangle({ x: margin, y: y - 5, width: width - 100, height: 20, color: primaryColor });
    y -= 2;
    page.drawText(`Account type:`, { x: margin + 10, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    page.drawText(`Account number:`, { x: width/2, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    y -= 15;
    page.drawText(`${accountName}`, { x: margin + 10, y, font: boldFont, size: 10 });
    page.drawText(`...${typeof accountName === 'string' && accountName.includes('Savvy') ? '5731' : (typeof accountName === 'string' && accountName.includes('Platinum') ? '8027' : '4775')}`, { x: width/2, y, font: boldFont, size: 10 });
    y -= 20;

    // Statement Details Table
    const details = [
        { label: 'Statement date:', value: new Date().toLocaleDateString('en-GB'), x1: margin, x2: margin + 100 },
        { label: 'Envelope:', value: '1 of 1', x1: width/2, x2: width/2 + 100 },
        { label: 'Statement period:', value: statementPeriod, x1: margin, x2: margin + 100 },
        { label: 'Total pages:', value: '1', x1: width/2, x2: width/2 + 100 },
        { label: 'Statement frequency:', value: 'Monthly', x1: margin, x2: margin + 100 },
        { label: 'ClientVATNumber:', value: '', x1: width/2, x2: width/2 + 100 }
    ];
    
    details.forEach((item, index) => {
        if (index % 2 === 0 && index > 0) y -= 12;
        page.drawText(item.label, { x: item.x1, y, font: boldFont, size: 9 });
        page.drawText(item.value, { x: item.x2, y, font, size: 9 });
    });
    
    y -= 30;

    // 3. Bank Charges and Cashflow
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: black });
    y -= 15;
    const col1X = margin;
    const col2X = width/2;
    let yCharges = y;
    let yCashflow = y;

    page.drawText('Bank charges summary', { x: col1X, y: yCharges, font: boldFont, size: 10 });
    yCharges -= 15;
    const charges = [
        { label: 'Electronic banking fees', value: formatCurrency(totalFees) },
        { label: 'Initiation fee', value: '0.00' },
        { label: 'Transaction service fees', value: '0.00' },
        { label: 'Other charges', value: '0.00' },
    ];
    charges.forEach(item => {
        page.drawText(item.label, { x: col1X, y: yCharges, font, size: 9 });
        page.drawText(`R ${item.value}`, { x: col1X + 150, y: yCharges, font, size: 9, color: black });
        yCharges -= 12;
    });
    yCharges -= 2;
    page.drawLine({ start: { x: col1X, y: yCharges }, end: { x: col1X + 200, y: yCharges }, thickness: 0.5, color: black });
    yCharges -= 12;
    page.drawText('Bank charge(s) (total)', { x: col1X, y: yCharges, font: boldFont, size: 9 });
    page.drawText(`R ${formatCurrency(totalFees)}`, { x: col1X + 150, y: yCharges, font: boldFont, size: 9 });
    yCharges -= 12;
    page.drawText('*VAT inclusive @', { x: col1X, y: yCharges, font, size: 9 });
    page.drawText('15.000%', { x: col1X + 150, y: yCharges, font, size: 9 });
     yCharges -= 12;
    page.drawText('VAT calculated monthly', { x: col1X, y: yCharges, font, size: 9 });
    page.drawText(`R ${formatCurrency(vatOnFees)}`, { x: col1X + 150, y: yCharges, font, size: 9 });


    page.drawText('Cashflow', { x: col2X, y: yCashflow, font: boldFont, size: 10 });
    yCashflow -= 15;
    const cashflow = [
        { label: 'Opening balance', value: formatCurrency(openingBalance) },
        { label: 'Funds received/Credits', value: formatCurrency(totalCredits) },
        { label: 'Funds used/Debits', value: formatCurrency(totalDebits) },
    ];
    cashflow.forEach(item => {
        page.drawText(item.label, { x: col2X, y: yCashflow, font, size: 9 });
        page.drawText(`R ${item.value}`, { x: col2X + 150, y: yCashflow, font, size: 9, color: black });
        yCashflow -= 12;
    });
    yCashflow -=2;
    page.drawLine({ start: { x: col2X, y: yCashflow }, end: { x: col2X + 200, y: yCashflow }, thickness: 0.5, color: black });
    yCashflow -= 12;
    page.drawText('Closing balance', { x: col2X, y: yCashflow, font: boldFont, size: 9 });
    page.drawText(`R ${formatCurrency(closingBalance)}`, { x: col2X + 150, y: yCashflow, font: boldFont, size: 9 });
    yCashflow -= 12;
    page.drawText('Annual credit interest rate', { x: col2X, y: yCashflow, font, size: 9 });
    page.drawText('0.000%', { x: col2X + 150, y: yCashflow, font, size: 9 });
    
    y = Math.min(yCharges, yCashflow) - 20;

    // 4. Transactions Table Header
    page.drawRectangle({ x: margin, y: y - 5, width: width - 100, height: 20, color: primaryColor });
    y -= 2;
    page.drawText('Date', { x: 55, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    page.drawText('Description', { x: 120, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    page.drawText('Debits(R)', { x: 340, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    page.drawText('Credits(R)', { x: 410, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    page.drawText('Balance(R)', { x: 490, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    y -= 15;

    // Opening Balance Row
    page.drawText(statementPeriod.split(' - ')[0], { x: 55, y, font, size: 9 });
    page.drawText('Opening balance', { x: 120, y, font: boldFont, size: 9 });
    page.drawText(formatCurrency(openingBalance), { x: 490, y, font, size: 9 });
    y -= 15;

    // Transaction Rows
    finalTransactions.forEach(tx => {
        if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: grayColor });
        page.drawText(new Date(tx.timestamp).toLocaleDateString('en-GB'), { x: 55, y, font, size: 9 });
        page.drawText(tx.description.substring(0, 40), { x: 120, y, font, size: 9 });
        if (tx.amount < 0) {
            page.drawText(formatCurrency(Math.abs(tx.amount)), { x: 340, y, font, size: 9 });
        } else {
            page.drawText(formatCurrency(tx.amount), { x: 410, y, font, size: 9 });
        }
        page.drawText(formatCurrency(tx.balance), { x: 490, y, font, size: 9 });
        y -= 15;
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);

    