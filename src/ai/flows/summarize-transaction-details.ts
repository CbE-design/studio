'use server';
/**
 * @fileOverview Summarizes transaction details for user verification before payment confirmation.
 *
 * - summarizeTransactionDetails - A function that takes in transaction details and returns a summary.
 * - SummarizeTransactionDetailsInput - The input type for the summarizeTransactionDetails function.
 * - SummarizeTransactionDetailsOutput - The return type for the summarizeTransactionDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTransactionDetailsInputSchema = z.object({
  recipientName: z.string().describe('The name of the recipient.'),
  accountNumber: z.string().describe('The account number of the recipient.'),
  bankName: z.string().describe('The name of the recipient bank.'),
  amount: z.number().describe('The amount to be transferred.'),
  reference: z.string().describe('The payment reference.'),
});
export type SummarizeTransactionDetailsInput = z.infer<typeof SummarizeTransactionDetailsInputSchema>;

const SummarizeTransactionDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the transaction details.'),
});
export type SummarizeTransactionDetailsOutput = z.infer<typeof SummarizeTransactionDetailsOutputSchema>;

export async function summarizeTransactionDetails(input: SummarizeTransactionDetailsInput): Promise<SummarizeTransactionDetailsOutput> {
  return summarizeTransactionDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTransactionDetailsPrompt',
  input: {schema: SummarizeTransactionDetailsInputSchema},
  output: {schema: SummarizeTransactionDetailsOutputSchema},
  prompt: `You are an AI assistant that summarizes transaction details for users before they confirm a payment.

  Please provide a concise summary of the following transaction details, highlighting the key information to help the user verify the payment before confirmation:

  Recipient Name: {{{recipientName}}}
  Account Number: {{{accountNumber}}}
  Bank Name: {{{bankName}}}
  Amount: {{{amount}}}
  Reference: {{{reference}}}

  Summary:`,
});

const summarizeTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeTransactionDetailsFlow',
    inputSchema: SummarizeTransactionDetailsInputSchema,
    outputSchema: SummarizeTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
