'use server';
/**
 * @fileOverview Generates standardized Nedbank statement references based on a blueprint.
 *
 * - generateStatementReference - A function that creates a clear, human-readable transaction description.
 * - GenerateStatementReferenceInput - The input type for the function.
 * - GenerateStatementReferenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStatementReferenceInputSchema = z.object({
  internalTransactionCode: z.enum([
    'POS_PURCHASE_LOCAL',
    'POS_PURCHASE_INTL',
    'ATM_WD_NED',
    'ATM_WD_SASW',
    'ATM_WD_INTL',
    'EFT_PAY_OUTGOING',
    'EFT_PAY_INCOMING',
    'DEBIT_ORD_EXT',
    'CASH_WD_RETAIL',
    'FEE_TRANSACTION',
    'INTERNAL_TRANSFER',
  ]).describe('A unique code identifying the transaction\'s nature.'),
  transactionStatus: z.enum(['COMPLETED', 'REVERSED', 'FAILED_FUNDS']).default('COMPLETED').describe('The final state of the transaction.'),
  merchantData: z.object({
    merchantName: z.string().optional(),
    merchantLocation: z.string().optional(),
  }).optional().describe('Data related to point-of-sale merchants.'),
  atmData: z.object({
    atmOwnerBank: z.string().optional(),
    atmNetwork: z.string().optional(),
  }).optional().describe('Data related to ATM transactions.'),
  eftData: z.object({
    beneficiaryReference: z.string().optional(),
    originatorReference: z.string().optional(),
    originatorName: z.string().optional(),
  }).optional().describe('Data for electronic fund transfers.'),
  uniqueTransactionId: z.string().optional().describe('A system-generated unique ID.'),
  feeData: z.object({
    feeDescription: z.string().optional(),
  }).optional().describe('Data for bank charge transactions.'),
  isCredit: z.boolean().optional().default(false).describe('Indicates if the transaction is a credit.'),
});
export type GenerateStatementReferenceInput = z.infer<typeof GenerateStatementReferenceInputSchema>;

const GenerateStatementReferenceOutputSchema = z.object({
  statementReference: z.string().describe('The generated, standardized statement reference.'),
});
export type GenerateStatementReferenceOutput = z.infer<typeof GenerateStatementReferenceOutputSchema>;

export async function generateStatementReference(input: GenerateStatementReferenceInput): Promise<GenerateStatementReferenceOutput> {
  return generateStatementReferenceFlow(input);
}

const generateStatementReferenceFlow = ai.defineFlow(
  {
    name: 'generateStatementReferenceFlow',
    inputSchema: GenerateStatementReferenceInputSchema,
    outputSchema: GenerateStatementReferenceOutputSchema,
  },
  async (input) => {
    let baseReference = '';

    // Step 1: Generate Base Reference
    switch (input.internalTransactionCode) {
      case 'POS_PURCHASE_LOCAL':
      case 'POS_PURCHASE_INTL':
        baseReference = [input.merchantData?.merchantName, input.merchantData?.merchantLocation].filter(Boolean).join(' ');
        break;
      case 'ATM_WD_NED':
        baseReference = `ATM CASH ${input.uniqueTransactionId?.substring(0, 15) || ''}`.trim();
        break;
      case 'ATM_WD_SASW':
        baseReference = `SASW CASH ${input.uniqueTransactionId?.substring(0, 15) || ''}`.trim();
        break;
      case 'ATM_WD_INTL':
        baseReference = `ATM W/D ${input.atmData?.atmOwnerBank || ''}`.trim();
        break;
      case 'EFT_PAY_OUTGOING':
        baseReference = input.eftData?.beneficiaryReference || '';
        break;
      case 'EFT_PAY_INCOMING':
        baseReference = input.eftData?.originatorReference || '';
        break;
      case 'DEBIT_ORD_EXT':
        baseReference = [input.eftData?.originatorName, input.eftData?.originatorReference].filter(Boolean).join(' ');
        break;
      case 'CASH_WD_RETAIL':
        baseReference = '24HOURCASH';
        break;
      case 'FEE_TRANSACTION':
        baseReference = input.feeData?.feeDescription || '';
        break;
      case 'INTERNAL_TRANSFER':
        baseReference = input.eftData?.beneficiaryReference || 'INTERNAL TRANSFER';
        break;
      default:
        baseReference = input.isCredit ? 'GENERAL CREDIT' : 'GENERAL DEBIT';
    }

    // Step 2: Apply Status Prefix
    let finalReference = baseReference;

    switch (input.transactionStatus) {
      case 'REVERSED':
        finalReference = `PAYMENT REVERSED: ${baseReference}`;
        break;
      case 'FAILED_FUNDS':
        finalReference = `DISHONOURED PAYMENT ${baseReference}`;
        break;
    }

    // Step 3: Sanitize and Truncate
    // For this implementation, we assume characters are valid.
    const statementReference = finalReference.substring(0, 40).toUpperCase();

    return { statementReference };
  }
);
