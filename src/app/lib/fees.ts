
import type { Account, TransactionType } from './definitions';

// This object acts as the single source of truth for all fee calculations.
// It can be easily updated when Nedbank (or any bank) publishes its annual pricing guide.
export const NEDBANK_FEE_SCHEDULE = {
  Cheque: {
    // 1. ATM Withdrawals (Vary by bank/location)
    ATM_WITHDRAWAL_OWN: {
      type: 'TIERED',
      baseFee: 2.50,
      perR100: 1.50,
      limit: null // No free limit
    },
    ATM_WITHDRAWAL_OTHER: {
      type: 'TIERED',
      baseFee: 10.00,
      perR100: 2.00,
      limit: null
    },
    // 2. Electronic Funds Transfers (EFTs)
    EFT_IMMEDIATE: {
      type: 'FIXED',
      amount: 40.00, // E.g., R40.00 for immediate payment
      limit: null
    },
    EFT_STANDARD: {
      type: 'FIXED', // Simplified from FREE_PLUS_FIXED for prototype
      amount: 1.00,
    },
    // 3. Point-of-Sale (POS) purchases
    POS_PURCHASE: {
      type: 'FREE',
      limit: null
    },
    // 4. Debit Orders
    DEBIT_ORDER: {
      type: 'FIXED',
      amount: 3.50,
    },
    BANK_FEE: {
        type: 'FREE' // Fees should not incur other fees
    }
  },
  Savings: {
    // Define fees for savings accounts...
  },
  Credit: {
    // Define fees for credit accounts...
  },
  Student: {
    // Define fees for student accounts...
  },
};

/**
 * Calculates the banking fee for a given transaction.
 * @param transactionAmount The amount of the transaction.
 * @param transactionType The type of transaction (e.g., 'EFT_IMMEDIATE').
 * @param accountType The type of account (e.g., 'Cheque').
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
      // Note: Math.ceil ensures any part of R100 incurs the fee. e.g. R100.01 is treated as two R100 blocks.
      const hundreds = Math.ceil(transactionAmount / 100);
      return feeRule.baseFee + (hundreds * feeRule.perR100);
      
    case 'FREE':
      return 0;
      
    default:
      return 0;
  }
}
