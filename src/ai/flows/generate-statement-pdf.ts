'use server';
/**
 * @fileOverview Generates a Statement PDF document using pdf-lib.
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
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        openingBalance -= amount;
    }

    let totalDebits = 0;
    let totalCredits = 0;
    
    let runningBalance = openingBalance;
    const finalTransactions = sortedTransactions.map(tx => {
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        runningBalance += amount;
        if (amount < 0) {
            totalDebits += Math.abs(amount);
        } else {
            totalCredits += amount;
        }
        return { ...tx, balance: runningBalance, amount: amount };
    });

    const closingBalance = runningBalance;
    
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

    // Header
    page.drawText('NEDBANK', { x: 50, y, font: boldFont, size: 20, color: primaryColor });
    
    const rightHeaderText = 'Computer-generated tax invoice';
    const textWidth = boldFont.widthOfTextAtSize(rightHeaderText, 12);
    page.drawText(rightHeaderText, { x: width - 50 - textWidth, y: y, font: boldFont, size: 12});
    
    y -= 40;

    // Account Summary
    page.drawText('Account summary', { x: 50, y, font: boldFont, size: 12 });
    y -= 15;
    page.drawRectangle({ x: 50, y: y - 2, width: width - 100, height: 20, color: primaryColor });
    page.drawText(`Account type: ${accountName}`, { x: 60, y, font: boldFont, size: 10, color: rgb(1,1,1) });
    y -= 40;

    // Cashflow
    page.drawText('Cashflow', { x: 50, y, font: boldFont, size: 12 });
    y-=15;
    page.drawLine({ start: { x: 50, y}, end: {x: width - 50, y }, thickness: 0.5, color: black});
    y-= 5;

    const cashflow = [
        { label: 'Opening balance', value: formatCurrency(openingBalance) },
        { label: 'Funds received/Credits', value: formatCurrency(totalCredits) },
        { label: 'Funds used/Debits', value: formatCurrency(totalDebits) },
        { label: 'Closing balance', value: formatCurrency(closingBalance) },
    ];
    
    cashflow.forEach(item => {
        y-=15;
        page.drawText(item.label, { x: 50, y, font, size: 10 });
        page.drawText(`R ${item.value}`, { x: width - 150, y, font, size: 10, color: black });
    });
    
    y -= 20;

    // Transactions Table Header
    page.drawRectangle({ x: 50, y: y - 5, width: width - 100, height: 20, color: primaryColor });
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
        page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: width - 50, y: y + 5 }, thickness: 0.5, color: grayColor });
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
