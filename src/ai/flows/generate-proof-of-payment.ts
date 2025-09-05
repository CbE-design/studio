'use server';
/**
 * @fileOverview Generates a Proof of Payment PDF document.
 *
 * - generateProofOfPaymentPdf - Creates a PDF from transaction details.
 * - GenerateProofOfPaymentInput - The input type for the function.
 * - GenerateProofOfPaymentOutput - The return type for the function (PDF as base64).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const GenerateProofOfPaymentInputSchema = z.object({
  date: z.string().describe("The date of the payment, e.g., '20/11/2025'"),
  transactionNumber: z.string().describe('The unique reference number for the transaction.'),
  recipient: z.string().describe('The name of the recipient.'),
  amount: z.string().describe('The payment amount, e.g., "100.00"'),
  recipientsReference: z.string().optional().describe("The recipient's reference."),
  yourReference: z.string().optional().describe("The sender's reference."),
  bankName: z.string().describe("The recipient's bank name."),
  accountNumber: z.string().describe("The recipient's account number."),
  fromAccountName: z.string().describe("The name of the account the payment was made from."),
});
export type GenerateProofOfPaymentInput = z.infer<typeof GenerateProofOfPaymentInputSchema>;

const GenerateProofOfPaymentOutputSchema = z.object({
  pdfBase64: z.string().describe('The generated PDF document, encoded in base64.'),
});
export type GenerateProofOfPaymentOutput = z.infer<typeof GenerateProofOfPaymentOutputSchema>;

export async function generateProofOfPaymentPdf(input: GenerateProofOfPaymentInput): Promise<GenerateProofOfPaymentOutput> {
  return generateProofOfPaymentPdfFlow(input);
}

const generateProofOfPaymentPdfFlow = ai.defineFlow(
  {
    name: 'generateProofOfPaymentPdfFlow',
    inputSchema: GenerateProofOfPaymentInputSchema,
    outputSchema: GenerateProofOfPaymentOutputSchema,
  },
  async (details) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const primaryColor = rgb(0 / 255, 112 / 255, 60 / 255); // Nedbank Green
    const grayColor = rgb(0.3, 0.3, 0.3);
    
    let y = height - 50;

    // Header
    page.drawText('NEDBANK', { x: 50, y, font: boldFont, size: 24, color: primaryColor });
    y -= 40;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: grayColor });
    y -= 30;

    // Title
    page.drawText('Notification of Payment', { x: 50, y, font: boldFont, size: 18 });
    y -= 20;
    page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: 50, y, font, size: 10 });
    y -= 25;

    // Main Details
    page.drawText('Date of Payment:', { x: 50, y, font, size: 10, color: grayColor });
    page.drawText(details.date, { x: 200, y, font: boldFont, size: 10 });
    y -= 15;
    page.drawText('Reference Number:', { x: 50, y, font, size: 10, color: grayColor });
    page.drawText(details.transactionNumber, { x: 200, y, font: boldFont, size: 10 });
    y -= 30;

    // Beneficiary Details
    page.drawText('Beneficiary details', { x: 50, y, font: boldFont, size: 12 });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: primaryColor });
    y -= 20;

    const beneficiaryDetails = [
      { label: 'Recipient', value: details.recipient },
      { label: 'Amount', value: `R ${parseFloat(details.amount).toFixed(2)}` },
      { label: 'Recipient Reference', value: details.recipientsReference || details.yourReference || 'N/A' },
      { label: 'Bank', value: details.bankName.toUpperCase() },
      { label: 'Account Number', value: `...${details.accountNumber.slice(-6)}` },
      { label: 'Channel', value: 'Internet payment' },
    ];

    beneficiaryDetails.forEach(item => {
        page.drawText(item.label + ':', { x: 50, y, font, size: 10, color: grayColor });
        page.drawText(item.value, { x: 200, y, font: boldFont, size: 10 });
        y -= 15;
    });
    y -= 15;

    // Payer Details
    page.drawText('Payer details', { x: 50, y, font: boldFont, size: 12 });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: primaryColor });
    y -= 20;

    page.drawText('Paid from Account Holder:', { x: 50, y, font, size: 10, color: grayColor });
    page.drawText('VAN SCHALKWYK FAMILY TRUST', { x: 200, y, font: boldFont, size: 10 });
    y -= 30;

    // Footer
    const footerText1 = 'Nedbank Ltd Reg No 1951/000009/06. Licensed financial services provider (FSP9363) and registered credit provider (NCRCP16).';
    page.drawText(footerText1, { x: 50, y: 80, font, size: 8, color: grayColor });
    const footerText2 = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.';
    page.drawText(footerText2, { x: 50, y: 70, font, size: 8, color: grayColor });


    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
