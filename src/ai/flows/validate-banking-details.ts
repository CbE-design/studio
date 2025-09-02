'use server';

/**
 * @fileOverview A flow to validate banking details of a new recipient using AI.
 *
 * - validateBankingDetails - A function that validates banking details.
 * - ValidateBankingDetailsInput - The input type for the validateBankingDetails function.
 * - ValidateBankingDetailsOutput - The return type for the validateBankingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateBankingDetailsInputSchema = z.object({
  accountNumber: z.string().describe('The account number of the recipient.'),
  bankCode: z.string().describe('The bank code of the recipient.'),
  recipientName: z.string().describe('The name of the recipient.'),
});
export type ValidateBankingDetailsInput = z.infer<typeof ValidateBankingDetailsInputSchema>;

const ValidateBankingDetailsOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the banking details are valid.'),
  confidence: z.number().describe('The confidence level of the validation (0-1).'),
  reason: z.string().describe('The reason for the validation result.'),
});
export type ValidateBankingDetailsOutput = z.infer<typeof ValidateBankingDetailsOutputSchema>;

export async function validateBankingDetails(
  input: ValidateBankingDetailsInput
): Promise<ValidateBankingDetailsOutput> {
  return validateBankingDetailsFlow(input);
}

const validateBankingDetailsPrompt = ai.definePrompt({
  name: 'validateBankingDetailsPrompt',
  input: {schema: ValidateBankingDetailsInputSchema},
  output: {schema: ValidateBankingDetailsOutputSchema},
  prompt: `You are a banking expert responsible for validating banking details.

  Determine if the provided banking details are valid and accurate.

  Consider the account number, bank code, and recipient name.

  Provide a confidence level (0-1) for your validation.

  Explain the reason for your validation result.

  Account Number: {{{accountNumber}}}
  Bank Code: {{{bankCode}}}
  Recipient Name: {{{recipientName}}}`,
});

const validateBankingDetailsFlow = ai.defineFlow(
  {
    name: 'validateBankingDetailsFlow',
    inputSchema: ValidateBankingDetailsInputSchema,
    outputSchema: ValidateBankingDetailsOutputSchema,
  },
  async input => {
    const {output} = await validateBankingDetailsPrompt(input);
    return output!;
  }
);
