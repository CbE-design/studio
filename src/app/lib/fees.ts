
import type { Account, TransactionType } from './definitions';

// This object acts as the single source of truth for all fee calculations.
// It can be easily updated when Nedbank (or any bank) publishes its annual pricing guide.
export const NEDBANK_FEE_SCHEDULE = {
  Cheque: {
    ATM_WITHDRAWAL_OWN: {
      type: 'TIERED',
      baseFee: 2.50,
      perR100: 1.50,
      limit: null, // No free limit
      description: 'SASW CASH'
    },
    ATM_WITHDRAWAL_OTHER: {
      type: 'TIERED',
      baseFee: 10.00,
      perR100: 2.00,
      limit: null,
      description: 'ATM CASH withdrawal'
    },
    EFT_IMMEDIATE: {
      type: 'FIXED',
      amount: 40.00,
      limit: null,
      description: 'Instant payment fee'
    },
    EFT_STANDARD: {
      type: 'FIXED',
      amount: 1.00,
      description: 'EFT payment fee'
    },
    POS_PURCHASE: {
      type: 'FREE',
      description: 'Point of Sale'
    },
    DEBIT_ORDER: {
      type: 'FIXED',
      amount: 3.50,
      description: 'Debit Order'
    },
    BANK_FEE: {
        type: 'FREE',
        description: 'Bank Fee'
    }
  },
  Savings: {
     EFT_IMMEDIATE: { type: 'FIXED', amount: 40.00, description: 'Instant payment fee' },
     EFT_STANDARD: { type: 'FIXED', amount: 1.00, description: 'EFT payment fee' },
     BANK_FEE: { type: 'FREE', description: 'Bank Fee' }
  },
  Student: {
     EFT_IMMEDIATE: { type: 'FIXED', amount: 10.00, description: 'Instant payment fee' },
     EFT_STANDARD: { type: 'FREE', description: 'EFT payment fee' },
     BANK_FEE: { type: 'FREE', description: 'Bank Fee' }
  },
  Credit: {
    BANK_FEE: { type: 'FREE', description: 'Bank Fee' }
  }
};

type FeeResult = {
    amount: number;
    description: string;
}

/**
 * Calculates the banking fee for a given transaction.
 * @param transactionAmount The amount of the transaction.
 * @param transactionType The type of transaction (e.g., 'EFT_IMMEDIATE').
 * @param accountType The type of account (e.g., 'Cheque').
 * @returns An object containing the calculated fee amount and its description.
 */
export function calculateFee(
  transactionAmount: number,
  transactionType: TransactionType,
  accountType: Account['type']
): FeeResult {
  
  const defaultResult = { amount: 0, description: 'No fee' };
  const accountFeeSchedule = NEDBANK_FEE_SCHEDULE[accountType];
  if (!accountFeeSchedule) {
    return defaultResult;
  }

  const feeRule = accountFeeSchedule[transactionType as keyof typeof accountFeeSchedule];
  if (!feeRule) {
    return defaultResult;
  }

  // @ts-ignore - feeRule type is not fully inferred here but logic is sound
  const description = feeRule.description || 'Bank Fee';

  // @ts-ignore
  switch (feeRule.type) {
    case 'FIXED':
      // @ts-ignore
      return { amount: feeRule.amount, description };
    
    case 'TIERED':
      const hundreds = Math.ceil(transactionAmount / 100);
      // @ts-ignore
      const amount = feeRule.baseFee + (hundreds * feeRule.perR100);
      return { amount, description };
      
    case 'FREE':
      return { amount: 0, description };
      
    default:
      return defaultResult;
  }
}
