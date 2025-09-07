'use server';
/**
 * @fileOverview Generates a Statement PDF document using pdf-lib, based on a detailed JSON input.
 *
 * - generateStatementPdf - Creates a PDF from a comprehensive statement data object.
 * - GenerateStatementPdfInput - The input type for the function, matching the detailed JSON structure.
 * - GenerateStatementPdfOutput - The return type for the function (PDF as base64).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts, PageSizes, grayscale } from 'pdf-lib';

// --- NEW INPUT SCHEMA BASED ON PROVIDED JSON ---
const AddressSchema = z.object({
  street: z.string(),
  suburb: z.string(),
  city: z.string(),
  postalCode: z.string(),
});

const RecipientSchema = z.object({
  name: z.string(),
  address: AddressSchema,
});

const ProviderDetailsSchema = z.object({
  address1: z.string(),
  address2: z.string(),
  vatRegNo: z.string(),
  contact: z.object({
    lostCards: z.string(),
    clientServices: z.string(),
  }),
});

const AccountSummarySchema = z.object({
  accountType: z.string(),
  accountNumber: z.string(),
  statementDate: z.string(),
  statementPeriod: z.object({
    from: z.string(),
    to: z.string(),
  }),
  statementFrequency: z.string(),
  page: z.string().optional(),
});

const CashflowSchema = z.object({
  currency: z.string(),
  openingBalance: z.number(),
  fundsReceived: z.number(),
  fundsUsed: z.number(),
  closingBalance: z.number(),
  annualizedInterestRate: z.number().optional(),
});

const BankChargesSummarySchema = z.object({
    currency: z.string(),
    electronicBankingFees: z.number(),
    initiationFee: z.number(),
    transactionServiceFees: z.number(),
    otherCharges: z.number(),
    totalCharges: z.number(),
    vatRate: z.number(),
});

const FundsReceivedBreakdownSchema = z.object({
    currency: z.string(),
    abnbIeterDeposits: z.number().optional(),
    electronicPaymentsReceived: z.number(),
    reversalsCredited: z.number(),
    transfersIn: z.number(),
    otherCredits: z.number().optional(),
    totalReceived: z.number(),
});

const FundsUsedBreakdownSchema = z.object({
    currency: z.string(),
    accountPayments: z.number(),
    cashWithdrawals: z.number(),
    debitCardPurchase: z.number(),
    electronicTransfers: z.number(),
    totalChargesAndFees: z.number(),
    otherDebits: z.number().optional(),
    totalUsed: z.number(),
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
  statementProvider: z.string(),
  statementType: z.string(),
  documentType: z.string(),
  recipient: RecipientSchema,
  providerDetails: ProviderDetailsSchema,
  accountSummary: AccountSummarySchema,
  cashflow: CashflowSchema,
  bankChargesSummary: BankChargesSummarySchema,
  fundsReceivedBreakdown: FundsReceivedBreakdownSchema,
  fundsUsedBreakdown: FundsUsedBreakdownSchema,
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
const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value.toString().replace(/[^0-9.-]+/g,"")) : value;
    if (typeof num !== 'number' || isNaN(num) || num === 0) return '';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
    page.drawRectangle({x: margin, y: y - 28, width: 95, height: 40, borderColor: black, borderWidth: 1});
    page.drawImage(logoImage, { x: margin + 2, y: y - 18, width: logoDims.width, height: logoDims.height });
    page.drawText(statementData.statementType, { x: margin + 18, y: y + 2, font: boldFont, size: 10 });
    page.drawText(formatDate(statementData.accountSummary.statementDate), { x: margin + 15, y: y - 22, font, size: 8 });

    page.drawImage(mainLogoImage, { x: width - margin - mainLogoDims.width, y: y - 10, width: mainLogoDims.width, height: mainLogoDims.height });
    y -= 55;
    const bankAddressY = y;
    page.drawText(statementData.providerDetails.address1, { x: rightColX, y: bankAddressY, font, size: 9 });
    page.drawText(statementData.providerDetails.address2, { x: rightColX, y: bankAddressY - 12, font, size: 9 });
    
    const clientAddress = [
        statementData.recipient.name,
        statementData.recipient.address.street,
        statementData.recipient.address.suburb,
        statementData.recipient.address.city,
        statementData.recipient.address.postalCode
    ];
    clientAddress.forEach((line, index) => {
        page.drawText(line, { x: margin, y: y - (index * 12), font: boldFont, size: 9 });
    });

    y -= 80;

    page.drawText(`Bank VAT Reg No. ${statementData.providerDetails.vatRegNo}`, { x: rightColX, y: y, font, size: 9 });
    page.drawText(`Lost cards ${statementData.providerDetails.contact.lostCards}`, { x: rightColX, y: y - 12, font, size: 9 });
    page.drawText(`Client services ${statementData.providerDetails.contact.clientServices}`, { x: rightColX, y: y - 24, font, size: 9 });
    page.drawText('nedbank.co.za', { x: rightColX, y: y - 36, font, size: 9 });
    
    y -= 50;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: black });
    page.drawText(statementData.documentType, { x: width/2 - 60, y: y - 12, font: boldFont, size: 9 });
    y -= 25;

    page.drawRectangle({x: margin, y: y - 45, width: width - (margin * 2), height: 50, color: primaryColor});
    page.drawText('CERTAIN CHEQUE SERVICES WILL NO LONGER BE AVAILABLE FROM', { x: margin + 10, y: y - 15, font: boldFont, size: 12, color: white });
    page.drawText('1 SEPTEMBER 2020.', { x: margin + 10, y: y - 30, font: boldFont, size: 12, color: white });
    page.drawText('PLEASE VISIT NEDBANK.CO.ZA FOR MORE INFORMATION.', { x: width - margin - 250, y: y - 30, font: boldFont, size: 9, color: white });
    y-= 50;

    page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: margin, y, font, size: 6 });
    y -= 15;

    page.drawText('Account summary', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
    y -= 5;
    page.drawRectangle({x: margin, y: y - 20, width: width - (margin * 2), height: 20, color: primaryColor});
    page.drawText('Account type', { x: margin + 5, y: y-15, font: boldFont, size: 9, color: white });
    page.drawText('Account number', { x: rightColX, y: y-15, font: boldFont, size: 9, color: white });
    y -= 35;
    page.drawText(statementData.accountSummary.accountType, { x: margin + 5, y, font, size: 9 });
    page.drawText(statementData.accountSummary.accountNumber, { x: rightColX, y, font, size: 9 });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: gray });
    y -= 15;
    
    const summaryDetails = [
        { labelLeft: 'Statement date:', valueLeft: formatDate(statementData.accountSummary.statementDate), labelRight: 'Envelope:', valueRight: statementData.accountSummary.page || '1 of 1' },
        { labelLeft: 'Statement period:', valueLeft: `${formatDate(statementData.accountSummary.statementPeriod.from)} - ${formatDate(statementData.accountSummary.statementPeriod.to)}`, labelRight: 'Total pages:', valueRight: '1' },
        { labelLeft: 'Statement frequency:', valueLeft: statementData.accountSummary.statementFrequency, labelRight: 'Client VAT number:', valueRight: 'N/A' },
    ];
    summaryDetails.forEach(detail => {
        page.drawText(detail.labelLeft, { x: margin + 5, y, font, size: 9 });
        page.drawText(detail.valueLeft, { x: margin + 100, y, font: boldFont, size: 9 });
        page.drawText(detail.labelRight, { x: rightColX, y, font, size: 9 });
        page.drawText(detail.valueRight, { x: rightColX + 100, y, font: boldFont, size: 9 });
        y -= 12;
    });
    y -= 15;

    const chargesLeftCol = margin + 5;
    const chargesRightColValueX = chargesLeftCol + 150;
    const cashflowLeftCol = rightColX;
    const cashflowRightColValueX = cashflowLeftCol + 150;

    page.drawText('Bank charges summary', { x: chargesLeftCol, y, font: boldFont, size: 11, color: primaryColor });
    page.drawText('Cashflow', { x: cashflowLeftCol, y, font: boldFont, size: 11, color: primaryColor });
    y -= 20;

    const bankCharges = statementData.bankChargesSummary;
    const bankChargesData = [
        { label: 'Electronic banking fees', value: formatCurrency(bankCharges.electronicBankingFees) },
        { label: 'Initiation fee', value: formatCurrency(bankCharges.initiationFee) },
        { label: 'Transaction service fees', value: formatCurrency(bankCharges.transactionServiceFees) },
        { label: 'Other charges', value: formatCurrency(bankCharges.otherCharges) },
        { label: 'Bank charge(s) (total)', value: formatCurrency(bankCharges.totalCharges), isBold: true },
        { label: 'VAT inclusive @', value: `${bankCharges.vatRate.toFixed(3)}%` },
    ];

    const cashflow = statementData.cashflow;
    const cashflowData = [
        { label: 'Opening balance', value: formatCurrency(cashflow.openingBalance), isBold: true },
        { label: 'Funds received/Credits', value: formatCurrency(cashflow.fundsReceived) },
        { label: 'Funds used/Debits', value: formatCurrency(cashflow.fundsUsed) },
        { label: 'Closing balance', value: formatCurrency(cashflow.closingBalance), isBold: true },
        { label: 'Annual credit interest rate', value: `${(cashflow.annualizedInterestRate || 0).toFixed(3)}%` },
    ];
    
    const rows = Math.max(bankChargesData.length, cashflowData.length);
    for (let i = 0; i < rows; i++) {
        if (bankChargesData[i]) {
            const currentFont = bankChargesData[i].isBold ? boldFont : font;
            page.drawText(bankChargesData[i].label, { x: chargesLeftCol, y, font: currentFont, size: 9 });
            page.drawText(`R ${bankChargesData[i].value}`, { x: chargesRightColValueX, width: 80, y, font: currentFont, size: 9, align: 'right' });
        }
        if (cashflowData[i]) {
            const currentFont = cashflowData[i].isBold ? boldFont : font;
            page.drawText(cashflowData[i].label, { x: cashflowLeftCol, y, font: currentFont, size: 9 });
            page.drawText(`R ${cashflowData[i].value}`, { x: cashflowRightColValueX, width: 80, y, font: currentFont, size: 9, align: 'right' });
        }
        y -= 15;
    }

    y -= 30;

    page.drawText('Transactions', { x: margin, y, font: boldFont, size: 12, color: primaryColor });
    y -= 15;

    const transTableTopY = y;
    const transCol1X = margin;       
    const transCol2X = transCol1X + 60;  
    const transCol3X = transCol2X + 200; 
    const transCol4X = transCol3X + 70; 
    const transCol5X = transCol4X + 70; 
    const tableWidth = width - (margin * 2);

    page.drawRectangle({x: margin, y: transTableTopY - 5, width: tableWidth, height: 20, color: primaryColor});
    page.drawText('Date', {x: transCol1X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Description', {x: transCol2X + 5, y: transTableTopY, color: white, font: boldFont, size: 9});
    page.drawText('Debits(R)', {x: transCol3X, y: transTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    page.drawText('Credits(R)', {x: transCol4X, y: transTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    page.drawText('Balance(R)', {x: transCol5X, y: transTableTopY, color: white, font: boldFont, size: 9, align: 'right'});
    y -= 25;

    statementData.transactions.forEach(tx => {
        if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        page.drawText(formatDate(tx.date), { x: transCol1X + 5, y, font, size: 9 });
        page.drawText(tx.description.substring(0, 35), { x: transCol2X + 5, y, font: tx.description.toLowerCase().includes('balance') ? boldFont : font, size: 9 });
        
        page.drawText(formatCurrency(tx.debit), { x: transCol3X, width: 60, y, font, size: 9, align: 'right' });
        page.drawText(formatCurrency(tx.credit), { x: transCol4X, width: 60, y, font, size: 9, align: 'right' });
        page.drawText(formatCurrency(tx.balance), { x: transCol5X, width: 70, y, font: tx.description.toLowerCase().includes('balance') ? boldFont : font, size: 9, align: 'right' });
        y -= 15;
    });
    
    const breakdownLeftCol = margin + 5;
    const breakdownRightColValueX = breakdownLeftCol + 200;

    const drawBreakdown = (title: string, data: {label: string, value: number}[], total: number) => {
        if (y < 150) { 
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
        }
        y -= 20;
        page.drawText(title, { x: margin, y, font: boldFont, size: 12, color: primaryColor });
        y -= 20;
        
        data.forEach(item => {
            page.drawText(item.label, { x: breakdownLeftCol, y, font, size: 9 });
            page.drawText(`R ${formatCurrency(item.value)}`, { x: breakdownRightColValueX, width: 80, y, font, size: 9, align: 'right' });
            y -= 15;
        });

        page.drawLine({ start: { x: breakdownLeftCol, y: y + 5 }, end: { x: breakdownLeftCol + 290, y: y + 5 }, thickness: 0.5, color: gray });
        page.drawText('Total', { x: breakdownLeftCol, y: y - 10, font: boldFont, size: 9 });
        page.drawText(`R ${formatCurrency(total)}`, { x: breakdownRightColValueX, width: 80, y: y - 10, font: boldFont, size: 9, align: 'right' });
        y -= 25;
    }

    const received = statementData.fundsReceivedBreakdown;
    const receivedData = [
        { label: 'Abnb ieter deposits', value: received.abnbIeterDeposits || 0 },
        { label: 'Electronic payments received', value: received.electronicPaymentsReceived },
        { label: 'Reversals credited', value: received.reversalsCredited },
        { label: 'Transfers in', value: received.transfersIn },
        { label: 'Other credits', value: received.otherCredits || 0 },
    ].filter(item => item.value > 0);
    drawBreakdown('Funds received breakdown', receivedData, received.totalReceived);

    const used = statementData.fundsUsedBreakdown;
    const usedData = [
        { label: 'Account payments', value: used.accountPayments },
        { label: 'Cash withdrawals', value: used.cashWithdrawals },
        { label: 'Debit card purchases', value: used.debitCardPurchase },
        { label: 'Electronic transfers', value: used.electronicTransfers },
        { label: 'Total charges and fees', value: used.totalChargesAndFees },
        { label: 'Other debits', value: used.otherDebits || 0 },
    ].filter(item => item.value > 0);
    drawBreakdown('Funds used breakdown', usedData, used.totalUsed);


    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
