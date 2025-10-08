
import type { Account, TransactionType } from './definitions';

// This object acts as the single source of truth for all fee calculations.
// It can be easily updated when Nedbank (or any bank) publishes its annual pricing guide.
export const NEDBANK_FEE_SCHEDULE = {
  CHEQUE: {
    EFT_IMMEDIATE: {
      type: 'FIXED',
      amount: 40.00,
    },
    EFT_STANDARD: {
      type: 'FIXED',
      amount: 1.00,
    },
    POS_PURCHASE: {
      type: 'FREE',
    },
    ATM_WITHDRAWAL_OWN: {
      type: 'TIERED',
      baseFee: 2.50,
      perR100: 1.50,
    },
    ATM_WITHDRAWAL_OTHER: {
      type: 'TIERED',
      baseFee: 10.00,
      perR100: 2.00,
    },
    DEBIT_ORDER: {
        type: 'FIXED',
        amount: 3.50,
    },
    BANK_FEE: {
        type: 'FREE' // Fees should not incur other fees
    }
  },
  SAVINGS: {
    // Define fees for savings accounts...
  },
  STUDENT: {
    // Define fees for student accounts...
  },
};

/**
 * Calculates the banking fee for a given transaction.
 * @param transactionAmount The amount of the transaction.
 * @param transactionType The type of transaction (e.g., 'EFT_IMMEDIATE').
 * @param accountType The type of account (e.g., 'CHEQUE').
 * @returns The calculated fee amount, or 0 if no fee applies.
 */
export function calculateFee(
  transactionAmount: number,
  transactionType: TransactionType,
  accountType: Account['type']
): number {
  
  const accountFeeSchedule = NEDBANK_FEE_SCHEDULE[accountType];
  if (!accountFeeSchedule) {
    return 0; // No fee schedule for this account type
  }

  const feeRule = accountFeeSchedule[transactionType];
  if (!feeRule) {
    return 0; // No fee rule for this transaction type
  }

  switch (feeRule.type) {
    case 'FIXED':
      return feeRule.amount;
    
    case 'TIERED':
      const hundreds = Math.ceil(transactionAmount / 100);
      return feeRule.baseFee + (hundreds * feeRule.perR100);
      
    case 'FREE':
      return 0;

    // In a real app, 'FREE_PLUS_FIXED' would require counting previous transactions.
    // For this prototype, we'll treat it as a simple fixed fee after a hypothetical limit.
    case 'FREE_PLUS_FIXED':
      // This is a simplified logic. A real implementation would need to query
      // the number of transactions in the current month.
      return feeRule.perTransaction;
      
    default:
      return 0;
  }
}
