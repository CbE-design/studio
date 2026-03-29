export type AccountType = 'Cheque' | 'Savings' | 'Student' | 'Credit';

const FEE_SCHEDULE: Record<string, Record<string, { type: string; amount?: number; baseFee?: number; perR100?: number }>> = {
  Cheque: {
    EFT_IMMEDIATE: { type: 'FIXED', amount: 40 },
    EFT_STANDARD: { type: 'FIXED', amount: 1 },
    POS_PURCHASE: { type: 'FREE' },
    DEBIT_ORDER: { type: 'FIXED', amount: 3.5 },
    BANK_FEE: { type: 'FREE' },
    ATM_WITHDRAWAL_OWN: { type: 'TIERED', baseFee: 2.5, perR100: 1.5 },
    ATM_WITHDRAWAL_OTHER: { type: 'TIERED', baseFee: 10, perR100: 2 },
  },
  Savings: {
    EFT_IMMEDIATE: { type: 'FIXED', amount: 40 },
    EFT_STANDARD: { type: 'FIXED', amount: 1 },
    BANK_FEE: { type: 'FREE' },
  },
  Student: {
    EFT_IMMEDIATE: { type: 'FIXED', amount: 10 },
    EFT_STANDARD: { type: 'FREE' },
    BANK_FEE: { type: 'FREE' },
  },
  Credit: {
    BANK_FEE: { type: 'FREE' },
  },
};

export function calculateFee(
  transactionAmount: number,
  paymentType: 'Standard EFT' | 'Instant Pay',
  accountType: AccountType,
): number {
  const txType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';
  const schedule = FEE_SCHEDULE[accountType];
  if (!schedule) return 0;
  const rule = schedule[txType];
  if (!rule) return 0;

  switch (rule.type) {
    case 'FIXED':
      return rule.amount ?? 0;
    case 'TIERED': {
      const hundreds = Math.ceil(transactionAmount / 100);
      return (rule.baseFee ?? 0) + hundreds * (rule.perR100 ?? 0);
    }
    case 'FREE':
    default:
      return 0;
  }
}
