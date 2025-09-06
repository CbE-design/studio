'use server';
/**
 * @fileOverview Generates a Proof of Payment PDF document based on a specific design.
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
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const black = rgb(0, 0, 0);
    const grayColor = rgb(0.3, 0.3, 0.3);
    const nedbankGreen = rgb(0 / 255, 112 / 255, 60 / 255);

    const margin = 50;
    let y = height - margin;

    // 1. Header Text
    page.drawText('NEDBANK', { x: margin, y, font: boldFont, size: 24, color: nedbankGreen });
    
    y -= 50;

    // 2. Title and separator line
    page.drawText('Notification of Payment', { x: margin, y, font: boldFont, size: 12, color: black });
    y -= 15;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: grayColor });
    y -= 25;

    // 3. Confirmation Text
    page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: margin, y, font, size: 10, color: black });
    y -= 25;

    // 4. Payment Details Table
    const detailsLeftColX = margin;
    const detailsColonColX = 180;
    const detailsRightColX = 200;

    const paymentDetailsData = [
        { label: 'Date of Payment', value: details.date },
        { label: 'Reference Number', value: details.transactionNumber },
    ];
    
    paymentDetailsData.forEach(item => {
        page.drawText(item.label, { x: detailsLeftColX, y, font, size: 10 });
        page.drawText(':', { x: detailsColonColX, y, font, size: 10 });
        page.drawText(item.value, { x: detailsRightColX, y, font, size: 10 });
        y -= 15;
    });

    y -= 20;

    // 5. Beneficiary Details
    page.drawText('Beneficiary details', { x: margin, y, font: boldFont, size: 11 });
    y -= 20;

    const beneficiaryDetails = [
      { label: 'Recipient', value: details.recipient },
      { label: 'Amount', value: `R${parseFloat(details.amount).toFixed(2)}` },
      { label: 'Recipient Reference', value: details.recipientsReference || details.yourReference || 'N/A' },
      { label: 'Bank', value: details.bankName.toUpperCase() },
      { label: 'Account Number', value: `...${details.accountNumber.slice(-6)}` },
      { label: 'Channel', value: 'Internet payment' },
    ];

    beneficiaryDetails.forEach(item => {
        page.drawText(item.label, { x: detailsLeftColX, y, font, size: 10 });
        page.drawText(':', { x: detailsColonColX, y, font, size: 10 });
        page.drawText(item.value, { x: detailsRightColX, y, font, size: 10 });
        y -= 15;
    });

    y -= 20;

    // 6. Payer Details
    page.drawText('Payer details', { x: margin, y, font: boldFont, size: 11 });
    y -= 20;
    page.drawText('Paid from Account Holder', { x: detailsLeftColX, y, font, size: 10 });
    page.drawText(':', { x: detailsColonColX, y, font, size: 10 });
    page.drawText(details.fromAccountName.toUpperCase(), { x: detailsRightColX, y, font, size: 10 });

    y -= 40;

    // 7. Disclaimers and Notes
    const disclaimerText1 = 'Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on\nwww.nedbank.co.za and click on Verify payments.';
    page.drawText(disclaimerText1, { x: margin, y, font, size: 10, lineHeight: 12 });
    y -= 40;
    
    const disclaimerText2 = `This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this\npayment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for\nenquiries regarding the contents of this notification.\nNedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability\nfor any loss or damage whatsoever nature, arising from the use thereof.\nPayments may take up to three business days. Please check your account to verify the existence of the funds.`;
    page.drawText(disclaimerText2, { x: margin, y, font, size: 10, lineHeight: 12 });
    y -= 100;

    const disclaimerText3 = 'Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification\nand authentication details.';
    page.drawText(disclaimerText3, { x: margin, y, font, size: 10, lineHeight: 12 });
    y -= 40;

    page.drawText('Nedbank Limited email disclaimer', { x: margin, y, font: boldFont, size: 10 });
    y -= 15;

    const disclaimerText4 = `This email and any accompanying attachments may contain confidential and proprietary information. This information is\nprivate and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire\ncommunication immediately and are notified that any disclosure, copying or distribution of or taking any action based on\nthis information is prohibited. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not\naccept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or\ntampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for\nwhatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment\nis required, please request a hard copy version.`;
    page.drawText(disclaimerText4, { x: margin, y, font, size: 8, lineHeight: 10 });
    y -= 110;

    // 8. Security Code
    page.drawText('Security Code', { x: detailsLeftColX, y, font, size: 10 });
    page.drawText(':', { x: detailsColonColX, y, font, size: 10 });
    // This is a placeholder for a real security code
    const securityCode = 'DB85BE175B1E35A823EBD2CDE32DC8D542472D1A';
    page.drawText(securityCode, { x: detailsRightColX, y, font, size: 10 });

    y -= 40;

    // Footer
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: grayColor });
    y -= 15;

    const footerText1 = 'Nedbank Limited Reg No 1951/000009/06. VAT Reg No 4320116074. 135 Rivonia Road, Sandown, Sandton, 2196, South Africa.';
    page.drawText(footerText1, { x: margin, y, font, size: 8, color: grayColor });
    y -= 12;

    const footerText2 = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.';
    page.drawText(footerText2, { x: margin, y, font, size: 8, color: grayColor });


    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64 };
  }
);
