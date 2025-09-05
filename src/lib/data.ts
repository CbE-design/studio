export const MOCK_CURRENT_DATE = new Date('2025-11-15T10:00:00');

// Savvy Bundle Account: Only includes the transfer from Platinum and the two reversed payments.
export const combinedInitialTransactions = [
  { timestamp: new Date('2025-11-14T09:00:00'), description: 'TRANSFER FROM PLATINUM', amount: '+R18000000.00' },
  { timestamp: new Date('2025-11-14T10:00:00'), description: 'MFOLOE ATTORNEYS INC', amount: '-R16300000.00' },
  { timestamp: new Date('2025-11-14T10:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-11-14T11:00:00'), description: 'FRANSISKA MEIRING', amount: '-R500000.00' },
  { timestamp: new Date('2025-11-14T11:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-11-14T12:00:00'), description: 'PAYMENT REVERSED: MFOLOE ATTORNEYS INC', amount: '+R16300000.00' },
  { timestamp: new Date('2025-11-14T12:05:00'), description: 'PAYMENT REVERSED: FRANSISKA MEIRING', amount: '+R500000.00' },
];

// Platinum Cheque Account: Shows the disbursement from the Trust and the transfer to the Savvy account.
export const initialPlatinumChequeTransactions = [
  { timestamp: new Date('2025-11-14T08:00:00'), description: 'VAN SCHALKWYK FAMILY TRUST', amount: '+R20000000.00' },
  { timestamp: new Date('2025-11-14T09:00:00'), description: 'TRANSFER TO SAVVY', amount: '-R18000000.00' },
  { timestamp: new Date('2025-11-14T09:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
];

// Third account remains simple for now.
export const initialThirdAccountTransactions = [
  { timestamp: new Date('2025-08-10'), description: 'INITIAL DEPOSIT', amount: '+R5000.00' },
  { timestamp: new Date('2025-08-11'), description: 'COFFEE SHOP', amount: '-R75.00' },
  { timestamp: new Date('2025-08-11'), description: 'FEE: POS_PURCHASE_LOCAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-12'), description: 'ONLINE SUBSCRIPTION', amount: '-R150.00' },
  { timestamp: new Date('2025-08-12'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
];
