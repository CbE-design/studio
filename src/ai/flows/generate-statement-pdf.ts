'use server';
/**
 * @fileOverview Generates a Statement PDF document using pdf-lib, based on a detailed JSON input that mirrors an authentic bank statement.
 *
 * - generateStatementPdf - Creates a PDF from a comprehensive statement data object.
 * - GenerateStatementPdfInput - The input type for the function, matching the detailed JSON structure.
 * - GenerateStatementPdfOutput - The return type for the function (PDF as base64).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts, PageSizes, grayscale } from 'pdf-lib';

// --- SCHEMA BASED ON PROVIDED IMAGE ---
const BankChargesSchema = z.object({
  electronicBankingFees: z.number(),
  initiationFee: z.number(),
  transactionServiceFees: z.number(),
  otherCharges: z.number(),
  totalCharges: z.number(),
  vatRate: z.number().default(15.0),
});

const TransactionSchema = z.object({
  transactionId: z.string().nullable(),
  date: z.string(),
  description: z.string(),
  fees: z.number(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
});

const GenerateStatementPdfInputSchema = z.object({
  statementDate: z.string().describe("The date the statement is generated, e.g., '2021-06-24'"),
  statementPeriod: z.object({
    from: z.string(),
    to: z.string(),
  }),
  openingBalance: z.number(),
  bankCharges: BankChargesSchema,
  transactions: z.array(TransactionSchema),
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
const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value) || value === 0) return '';
    const fixedValue = value.toFixed(2);
    // Add spaces for thousands separator
    return fixedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


const generateStatementPdfFlow = ai.defineFlow(
  {
    name: 'generateStatementPdfFlow',
    inputSchema: GenerateStatementPdfInputSchema,
    outputSchema: GenerateStatementPdfOutputSchema,
  },
  async (statementData) => {
    
    // PDF Generation
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const mainLogoUrl = 'https://i.ibb.co/28SpD9k/nedbank-main-logo.png';
    const mainLogoImageBytes = await fetch(mainLogoUrl).then((res) => res.arrayBuffer());
    const mainLogoImage = await pdfDoc.embedPng(mainLogoImageBytes);
    const mainLogoDims = mainLogoImage.scale(0.12);

    const primaryColor = rgb(0 / 255, 112 / 255, 60 / 255); // Nedbank Green
    const black = rgb(0, 0, 0);
    const white = rgb(1,1,1);
    const gray = grayscale(0.5);

    let y = height - 40;
    const margin = 50;
    
    // 1. Header Section
    // Left Box
    page.drawRectangle({x: margin, y: y - 30, width: 100, height: 45, borderColor: black, borderWidth: 0.5});
    page.drawText('NEDBANK', { x: margin + 5, y: y - 5, font: boldFont, size: 8 });
    page.drawText('Reg No. 1951/000009/06', { x: margin + 5, y: y - 15, font, size: 6 });
    page.drawText('eConfirm', { x: margin + 25, y: y + 8, font: boldFont, size: 10, color: primaryColor });
    page.drawText(formatDate(statementData.statementDate), { x: margin + 20, y: y - 25, font, size: 8 });

    // Right Logo
    page.drawImage(mainLogoImage, { x: width - margin - mainLogoDims.width, y: y, width: mainLogoDims.width, height: mainLogoDims.height });
    
    y -= 80;

    // 2. Bank Charges Section
    const fromDate = formatDate(statementData.statementPeriod.from);
    const toDate = formatDate(statementData.statementPeriod.to);
    page.drawText(`Bank charges for the period ${fromDate} to ${toDate}`, { x: margin, y, font: boldFont, size: 12, color: primaryColor });
    y -= 20;

    const chargesTableTopY = y;
    const chargesCol1X = margin;       
    const chargesCol2X = chargesCol1X + 350; 
    const chargesCol3X = chargesCol2X + 70;  
    const chargesCol4X = chargesCol3X + 70;  
    const tableWidth = width - (margin * 2);

    page.drawRectangle({x: margin, y: chargesTableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('NarrativeDescription', {x: chargesCol1X + 5, y: chargesTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Itemcost(R)', {x: chargesCol2X + 20, y: chargesTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    page.drawText('VAT(R)', {x: chargesCol3X + 20, y: chargesTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    page.drawText('Total(R)', {x: chargesCol4X + 20, y: chargesTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    
    y -= 25;
    
    const { bankCharges } = statementData;
    const vatRate = bankCharges.vatRate / 100;

    const chargesData = [
        { label: 'Electronic banking fees', total: bankCharges.electronicBankingFees },
        { label: 'Initiation fee', total: bankCharges.initiationFee },
        { label: 'Transaction service fees', total: bankCharges.transactionServiceFees },
        { label: 'Other charges', total: bankCharges.otherCharges },
    ];

    chargesData.forEach(charge => {
        if (charge.total > 0) {
            const vat = charge.total * (vatRate / (1 + vatRate));
            const itemCost = charge.total - vat;
            page.drawText(charge.label, { x: chargesCol1X + 5, y, font, size: 9 });
            page.drawText(formatCurrency(itemCost), { x: chargesCol2X + 20, y, font, size: 9, align: 'right' });
            page.drawText(formatCurrency(vat), { x: chargesCol3X + 20, y, font, size: 9, align: 'right' });
            page.drawText(formatCurrency(charge.total), { x: chargesCol4X + 20, y, font, size: 9, align: 'right' });
            y -= 15;
            page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        }
    });

    const totalVat = bankCharges.totalCharges * (vatRate / (1 + vatRate));
    const totalItemCost = bankCharges.totalCharges - totalVat;
    page.drawText('TotalCharges', { x: chargesCol1X + 5, y, font: boldFont, size: 9 });
    page.drawText(formatCurrency(totalItemCost), { x: chargesCol2X + 20, y, font: boldFont, size: 9, align: 'right' });
    page.drawText(formatCurrency(totalVat), { x: chargesCol3X + 20, y, font: boldFont, size: 9, align: 'right' });
    page.drawText(formatCurrency(bankCharges.totalCharges), { x: chargesCol4X + 20, y, font: boldFont, size: 9, align: 'right' });
    y -= 30;


    // 3. Transactions Table
    const transTableTopY = y;
    const transCol1X = margin;       
    const transCol2X = transCol1X + 60;  
    const transCol3X = transCol2X + 180; 
    const transCol4X = transCol3X + 60; 
    const transCol5X = transCol4X + 60; 
    const transCol6X = transCol5X + 60;

    page.drawRectangle({x: margin, y: transTableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('TranIstno', {x: transCol1X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Date', {x: transCol2X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Description', {x: transCol3X - 70, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Fees(R)', {x: transCol4X - 10, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Debits(R)', {x: transCol5X - 10, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Credits(R)', {x: transCol6X - 10, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Balance(R)', {x: width - margin - 50, y: transTableTopY, color: white, font: boldFont, size: 9});
    y -= 25;

    // Opening Balance Row
    page.drawText(formatDate(statementData.transactions[0]?.date || statementData.statementPeriod.from), { x: transCol2X + 5, y, font, size: 9 });
    page.drawText('Openingbalance', { x: transCol3X - 70, y, font: boldFont, size: 9 });
    page.drawText(formatCurrency(statementData.openingBalance), { x: width - margin - 5, width: 70, y, font: boldFont, size: 9, align: 'right' });
    y -= 15;

    statementData.transactions.forEach(tx => {
        if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        page.drawText(tx.transactionId || '', { x: transCol1X + 5, y, font, size: 9 });
        page.drawText(formatDate(tx.date), { x: transCol2X + 5, y, font, size: 9 });
        page.drawText(tx.description.substring(0, 35), { x: transCol3X - 70, y, font, size: 9 });
        
        page.drawText(formatCurrency(tx.fees), { x: transCol4X - 15, width: 60, y, font, size: 9, align: 'right' });
        page.drawText(formatCurrency(tx.debit), { x: transCol5X - 15, width: 60, y, font, size: 9, align: 'right' });
        page.drawText(formatCurrency(tx.credit), { x: transCol6X - 15, width: 60, y, font, size: 9, align: 'right' });
        page.drawText(formatCurrency(tx.balance), { x: width - margin - 5, width: 70, y, font, size: 9, align: 'right' });
        y -= 15;
    });

    // Final Balance Row
    const lastTx = statementData.transactions[statementData.transactions.length - 1];
    if (lastTx) {
      page.drawText('Balancecarriedforward', { x: transCol3X - 70, y, font: boldFont, size: 9 });
      page.drawText(formatCurrency(lastTx.balance), { x: width - margin - 5, width: 70, y, font: boldFont, size: 9, align: 'right' });
    }
    
    // 4. Footer Section
    const footerY = 50;
    const seemoneydifferentlyUrl = 'https://i.ibb.co/Yd4QyNq/seemoneydifferently.png';
    const seemoneydifferentlyBytes = await fetch(seemoneydifferentlyUrl).then(res => res.arrayBuffer());
    const seemoneydifferentlyImage = await pdfDoc.embedPng(seemoneydifferentlyBytes);
    const seemoneydifferentlyDims = seemoneydifferentlyImage.scale(0.3);
    page.drawImage(seemoneydifferentlyImage, { x: margin, y: footerY, width: seemoneydifferentlyDims.width, height: seemoneydifferentlyDims.height });

    const footerLogoUrl = 'https://i.ibb.co/Ldn0sRk/nedbank-logo.png';
    const footerLogoBytes = await fetch(footerLogoUrl).then(res => res.arrayBuffer());
    const footerLogoImage = await pdfDoc.embedPng(footerLogoBytes);
    const footerLogoDims = footerLogoImage.scale(0.08);
    page.drawImage(footerLogoImage, { x: width - margin - footerLogoDims.width - 100, y: footerY + 5, width: footerLogoDims.width, height: footerLogoDims.height });

    const footerText = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution\nthrough the Ombudsman for Banking Services. Authorised financial services and registered credit provider (NCRCP16).';
    page.drawText(footerText, { x: width - margin - 380, y: footerY - 5, font, size: 6, lineHeight: 8, color: gray });


    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
