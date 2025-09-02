'use server';
/**
 * @fileOverview Generates an SMS notification for a successful payment.
 *
 * - sendPaymentNotification - A function that takes payment details and returns an SMS message.
 * - SendPaymentNotificationInput - The input type for the sendPaymentNotification function.
 * - SendPaymentNotificationOutput - The return type for the sendPaymentNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendPaymentNotificationInputSchema = z.object({
  recipientName: z.string().describe('The name of the recipient.'),
  amount: z.number().describe('The amount that was transferred.'),
  senderName: z.string().describe('The name of the person who sent the money.'),
  yourReference: z.string().optional().describe('The reference for the payment provided by the sender.'),
});
export type SendPaymentNotificationInput = z.infer<typeof SendPaymentNotificationInputSchema>;

const SendPaymentNotificationOutputSchema = z.object({
  smsMessage: z.string().describe('A concise SMS notification message for the recipient.'),
});
export type SendPaymentNotificationOutput = z.infer<typeof SendPaymentNotificationOutputSchema>;

export async function sendPaymentNotification(input: SendPaymentNotificationInput): Promise<SendPaymentNotificationOutput> {
  return sendPaymentNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendPaymentNotificationPrompt',
  input: {schema: SendPaymentNotificationInputSchema},
  output: {schema: SendPaymentNotificationOutputSchema},
  prompt: `You are an AI assistant for a bank. Your task is to generate a short and professional SMS notification for a payment recipient.

  The message should be concise and clear.

  Payment Details:
  - Recipient Name: {{{recipientName}}}
  - Amount: R{{{amount}}}
  - Sender Name: {{{senderName}}}
  - Sender Reference: {{{yourReference}}}

  Generate the SMS message text now. For example: "Nedbank: A payment of R100.00 was made to you from John Doe with reference 'Invoice 123'."`,
});

const sendPaymentNotificationFlow = ai.defineFlow(
  {
    name: 'sendPaymentNotificationFlow',
    inputSchema: SendPaymentNotificationInputSchema,
    outputSchema: SendPaymentNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
