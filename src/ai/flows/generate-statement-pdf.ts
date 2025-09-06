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
const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

    let totalFees = 0;
    
    let runningBalance = openingBalance;
    const finalTransactions = sortedTransactions.map(tx => {
        const amount = parseFloat(tx.amount.replace('R', '').replace(/ /g, ''));
        runningBalance += amount;
        if (tx.description.toLowerCase().includes('fee:')) {
            totalFees += Math.abs(amount);
        }
        return { ...tx, balance: runningBalance, amount };
    });
    
    const statementPeriod = sortedTransactions.length > 0
        ? `${new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} to ${new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : "N/A";

    const vatOnFees = totalFees * (15 / 115);
    const itemCostFees = totalFees - vatOnFees;

    // PDF Generation
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed the logo
    const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.appspot.com/o/NED.JO.png?alt=media&token=4070ec81-1e57-45d8-93e4-9977f97229c6';
    const logoImageBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const logoDims = logoImage.scale(0.05);
    
    const primaryColor = rgb(0 / 255, 112 / 255, 60 / 255); // Nedbank Green
    const black = rgb(0, 0, 0);
    const white = rgb(1,1,1);

    let y = height - 40;
    const margin = 50;
    
    // 1. Header
    page.drawImage(logoImage, {
        x: margin,
        y: y - logoDims.height + 25,
        width: logoDims.width,
        height: logoDims.height,
    });
    page.drawText('Account Statement', { x: width - margin - 120, y, font: boldFont, size: 16, color: black });
    y -= 50;

    // eConfirm Box
    const eConfirmBoxWidth = 80;
    page.drawRectangle({x: margin, y: y, width: eConfirmBoxWidth, height: 30, borderColor: black, borderWidth: 1});
    page.drawText('eConfirm', { x: margin + 18, y: y + 15, font: boldFont, size: 10 });
    page.drawText(new Date().toLocaleDateString('en-GB'), { x: margin + 15, y: y + 5, font, size: 8 });
    y -= 20;

    // Bank Charges Period
    page.drawText(`Bank charges for the period ${statementPeriod}`, { x: margin, y, font: boldFont, size: 11 });
    y -= 25;

    // 2. Bank Charges Table
    const tableTopY = y;
    const col1X = margin;
    const col2X = col1X + 250;
    const col3X = col2X + 80;
    const col4X = col3X + 80;
    const tableWidth = width - (margin * 2);

    // Header
    page.drawRectangle({x: margin, y: tableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('NarrativeDescription', {x: col1X + 5, y: tableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Itemcost(R)', {x: col2X + 5, y: tableTopY, color: white, font: boldFont, size: 9});
    page.drawText('VAT(R)', {x: col3X + 5, y: tableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Total(R)', {x: col4X + 5, y: tableTopY, color: white, font: boldFont, size: 9});
    y -= 25;
    
    // Rows
    const chargesData = [
        { desc: 'Electronic banking fees', cost: formatCurrency(itemCostFees), vat: formatCurrency(vatOnFees), total: formatCurrency(totalFees) },
        { desc: 'Initiation fee', cost: '0.00', vat: '0.00', total: '0.00' },
        { desc: 'Transaction service fees', cost: '0.00', vat: '0.00', total: '0.00' },
        { desc: 'Other charges', cost: '0.00', vat: '0.00', total: '0.00' },
    ];
    chargesData.forEach(charge => {
        page.drawText(charge.desc, {x: col1X + 5, y, color: black, font, size: 9});
        page.drawText(charge.cost, {x: col2X + 5, y, color: black, font, size: 9});
        page.drawText(charge.vat, {x: col3X + 5, y, color: black, font, size: 9});
        page.drawText(charge.total, {x: col4X + 5, y, color: black, font, size: 9});
        y -= 15;
    });
    
    // Total
    y -= 5;
    page.drawLine({ start: { x: col1X, y }, end: { x: width-margin, y }, thickness: 0.5, color: black });
    y -= 15;
    page.drawText('TotalCharges', {x: col1X + 5, y, color: black, font: boldFont, size: 9});
    page.drawText(formatCurrency(totalFees), {x: col4X + 5, y, color: black, font: boldFont, size: 9});
    y -= 40;


    // 3. Transactions Table
    const transTableTopY = y;
    const transCol1X = margin;       // Date
    const transCol2X = transCol1X + 80;  // Description
    const transCol3X = transCol2X + 180; // Fees
    const transCol4X = transCol3X + 60;  // Debits
    const transCol5X = transCol4X + 60;  // Credits
    const transCol6X = transCol5X + 60;  // Balance

    // Header
    page.drawRectangle({x: margin, y: transTableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('Date', {x: transCol1X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Description', {x: transCol2X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Fees(R)', {x: transCol3X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Debits(R)', {x: transCol4X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Credits(R)', {x: transCol5X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Balance(R)', {x: transCol6X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    y -= 25;

    // Opening Balance Row
    const firstDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].timestamp).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    page.drawText(firstDate, { x: transCol1X + 5, y, font, size: 9 });
    page.drawText('Openingbalance', { x: transCol2X + 5, y, font: boldFont, size: 9 });
    page.drawText(formatCurrency(openingBalance), { x: transCol6X + 5, y, font, size: 9 });
    y -= 15;

    // Transaction Rows
    finalTransactions.forEach(tx => {
        if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        page.drawText(new Date(tx.timestamp).toLocaleDateString('en-GB'), { x: transCol1X + 5, y, font, size: 9 });
        page.drawText(tx.description.substring(0, 35), { x: transCol2X + 5, y, font, size: 9 });
        
        const isFee = tx.description.toLowerCase().includes('fee:');
        if (isFee) {
             page.drawText(formatCurrency(Math.abs(tx.amount)), { x: transCol3X + 5, y, font, size: 9 });
        } else if (tx.amount < 0) {
            page.drawText(formatCurrency(Math.abs(tx.amount)), { x: transCol4X + 5, y, font, size: 9 });
        } else {
            page.drawText(formatCurrency(tx.amount), { x: transCol5X + 5, y, font, size: 9 });
        }
        
        page.drawText(formatCurrency(tx.balance), { x: transCol6X + 5, y, font, size: 9 });
        y -= 15;
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
