
'use server';
/**
 * @fileOverview Sends an email with a PDF attachment. (Currently simulates sending).
 *
 * - sendEmail - A function that takes email details and a PDF attachment and sends it.
 * - SendEmailInput - The input type for the sendEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML body of the email.'),
  pdfBase64: z.string().describe('The PDF attachment, encoded in base64.'),
  pdfFilename: z.string().describe('The filename for the PDF attachment.'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<void> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, subject, body, pdfBase64, pdfFilename }) => {
    // This is a placeholder for a real email sending service integration (e.g., SendGrid, Nodemailer).
    // For this example, we'll just log the details to the console to simulate the action.
    
    console.log('--- SIMULATING EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Filename: ${pdfFilename}`);
    console.log('Body:', body.substring(0, 100) + '...'); // Log a snippet of the body
    console.log('PDF Attachment (Base64 length):', pdfBase64.length);
    console.log('--- EMAIL SIMULATION COMPLETE ---');

    // In a real application, you would replace the console logs with a call to your email provider's API.
    // For example, using SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: to,
      from: 'noreply@yourbank.com', // Use a verified sender
      subject: subject,
      html: body,
      attachments: [
        {
          content: pdfBase64,
          filename: pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send email via SendGrid:', error);
      throw new Error('Email sending failed.');
    }
    */
  }
);
