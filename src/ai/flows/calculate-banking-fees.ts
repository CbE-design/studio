'use server';
/**
 * @fileOverview Calculates banking fees based on the provided 2025 Nedbank fee structure.
 *
 * - calculateBankingFees - A function that calculates the fee for a given transaction.
 * - CalculateBankingFeesInput - The input type for the calculateBankingFees function.
 * - CalculateBankingFeesOutput - The return type for the calculateBankingFees function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionCountersSchema = z.object({
  nedbank_atm_wd_count: z.number().default(0).describe('Number of Nedbank ATM withdrawals this month.'),
  nedbank_atm_dep_value: z.number().default(0).describe('Total value of Nedbank ATM deposits this month.'),
});

const CalculateBankingFeesInputSchema = z.object({
  accountId: z.enum(['GOLD_SAVVY_BUNDLE', 'PLATINUM_CHEQUE']).describe('The client\'s account profile ID.'),
  transactionCode: z.enum([
    'FEE_MONTHLY',
    'POS_PURCHASE_LOCAL',
    'POS_PURCHASE_INTL',
    'EFT_PAY_DIGITAL',
    'DEBIT_ORD_INT',
    'DEBIT_ORD_EXT',
    'ATM_WD_NED',
    'ATM_WD_SASW',
    'ATM_WD_INTL',
    'CASH_DEP_NED_ATM',
    'CASH_WD_RETAIL',
    'CASH_DEP_RETAIL',
    'SVC_REVERSAL_DO',
    'SVC_NOTIFICATION',
  ]).describe('The standardized code for the transaction type.'),
  transactionValue: z.number().optional().describe('The value of the transaction in ZAR.'),
  counters: TransactionCountersSchema.describe('The current monthly transaction counters for the account.'),
});
export type CalculateBankingFeesInput = z.infer<typeof CalculateBankingFeesInputSchema>;

const CalculateBankingFeesOutputSchema = z.object({
  fee: z.number().describe('The calculated fee for the transaction, inclusive of VAT.'),
  updatedCounters: TransactionCountersSchema.describe('The counters after this transaction has been processed.'),
});
export type CalculateBankingFeesOutput = z.infer<typeof CalculateBankingFeesOutputSchema>;

export async function calculateBankingFees(input: CalculateBankingFeesInput): Promise<CalculateBankingFeesOutput> {
  return calculateBankingFeesFlow(input);
}

// Fee Structures based on the blueprint
const accountProfiles = {
  GOLD_SAVVY_BUNDLE: {
    fixed_monthly_fee: 122.00,
    bundled: {
      ATM_WD_NED: { limit: 4, counter: 'nedbank_atm_wd_count' },
      CASH_DEP_NED_ATM: { limit: 5000, counter: 'nedbank_atm_dep_value' },
      POS_PURCHASE_LOCAL: { limit: Infinity },
      EFT_PAY_DIGITAL: { limit: Infinity },
      DEBIT_ORD_INT: { limit: Infinity },
      DEBIT_ORD_EXT: { limit: Infinity },
      CASH_WD_RETAIL: { limit: Infinity },
    },
    pay_as_you_use: {
      ATM_WD_NED: (value = 0) => Math.ceil(value / 100) * 2.65,
      CASH_DEP_NED_ATM: (value = 0) => Math.ceil(value / 100) * 2.65,
      ATM_WD_SASW: (value = 0) => 12.00 + (Math.ceil(value / 100) * 2.65),
      ATM_WD_INTL: (value = 0) => 65.00 + (Math.ceil(value / 100) * 2.65),
      CASH_DEP_RETAIL: () => 20.00,
      SVC_REVERSAL_DO: () => 30.00,
      SVC_NOTIFICATION: () => 1.00,
    },
  },
  PLATINUM_CHEQUE: {
    fixed_monthly_fee: 240.00,
    bundled: {
        POS_PURCHASE_LOCAL: { limit: Infinity },
        EFT_PAY_DIGITAL: { limit: Infinity },
        DEBIT_ORD_INT: { limit: Infinity },
        DEBIT_ORD_EXT: { limit: Infinity },
        CASH_WD_RETAIL: { limit: Infinity },
        ATM_WD_NED: { limit: Infinity },
        CASH_DEP_NED_ATM: { limit: Infinity },
    },
    pay_as_you_use: {
      ATM_WD_SASW: (value = 0) => 12.00 + (Math.ceil(value / 100) * 2.65),
      ATM_WD_INTL: (value = 0) => 65.00 + (Math.ceil(value / 100) * 2.65),
      CASH_DEP_RETAIL: () => 20.00,
      SVC_REVERSAL_DO: () => 30.00,
      SVC_NOTIFICATION: () => 1.00,
    },
  },
};

const calculateBankingFeesFlow = ai.defineFlow(
  {
    name: 'calculateBankingFeesFlow',
    inputSchema: CalculateBankingFeesInputSchema,
    outputSchema: CalculateBankingFeesOutputSchema,
  },
  async ({ accountId, transactionCode, transactionValue = 0, counters }) => {
    const profile = accountProfiles[accountId];
    const updatedCounters = { ...counters };
    let fee = 0;

    if (transactionCode === 'FEE_MONTHLY') {
        return { fee: profile.fixed_monthly_fee, updatedCounters };
    }

    const bundleRule = profile.bundled[transactionCode as keyof typeof profile.bundled];
    const paygFunc = profile.pay_as_you_use[transactionCode as keyof typeof profile.pay_as_you_use];

    if (bundleRule) {
      if (bundleRule.counter && bundleRule.counter in updatedCounters) {
        const counterKey = bundleRule.counter as keyof typeof updatedCounters;
        const currentCount = updatedCounters[counterKey];

        // Handle value-based limit (CASH_DEP_NED_ATM)
        if (counterKey === 'nedbank_atm_dep_value') {
          const totalValueAfter = currentCount + transactionValue;
          if (currentCount < bundleRule.limit) {
            const outOfBundleValue = totalValueAfter > bundleRule.limit ? totalValueAfter - bundleRule.limit : 0;
            if (outOfBundleValue > 0 && paygFunc) {
              fee = paygFunc(outOfBundleValue);
            }
          } else { // Already over the limit
            if (paygFunc) fee = paygFunc(transactionValue);
          }
          updatedCounters[counterKey] = totalValueAfter;
        } 
        // Handle count-based limit (ATM_WD_NED)
        else {
            if (currentCount < bundleRule.limit) {
                fee = 0; // In-bundle
            } else {
                if (paygFunc) fee = paygFunc(transactionValue); // Out-of-bundle
            }
            updatedCounters[counterKey]++;
        }
      } else {
        // Unlimited bundle
        fee = 0;
      }
    } else if (paygFunc) {
      // Purely pay-as-you-use transaction
      fee = paygFunc(transactionValue);
    }

    return { fee, updatedCounters };
  }
);
