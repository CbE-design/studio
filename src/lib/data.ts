export const MOCK_CURRENT_DATE = new Date('2025-11-15T10:00:00');

// Savvy Bundle Account: Reflects the new date for the inter-account transfer.
export const combinedInitialTransactions = [
  { timestamp: new Date('2025-08-14T10:00:00'), description: 'INTER-ACCOUNT TRANSFER', amount: '+R18000000.00' },
  { timestamp: new Date('2025-11-14T10:00:00'), description: 'MFOLOE ATTORNEYS INC', amount: '-R16300000.00' },
  { timestamp: new Date('2025-11-14T10:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-11-14T11:00:00'), description: 'FRANSISKA MEIRING', amount: '-R500000.00' },
  { timestamp: new Date('2025-11-14T11:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-11-14T12:00:00'), description: 'PAYMENT REVERSED: MFOLOE ATTORNEYS INC', amount: '+R16300000.00' },
  { timestamp: new Date('2025-11-14T12:05:00'), description: 'PAYMENT REVERSED: FRANSISKA MEIRING', amount: '+R500000.00' },
];

// Platinum Cheque Account: A much more detailed and realistic history.
export const initialPlatinumChequeTransactions = [
  // Historical Monthly Trust Payments (totalling ~R8m)
  { timestamp: new Date('2022-01-15T09:00:00'), description: 'TRUST PAYMENT JAN22', amount: '+R150000.00' },
  { timestamp: new Date('2022-02-15T09:00:00'), description: 'TRUST PAYMENT FEB22', amount: '+R200000.00' },
  { timestamp: new Date('2022-03-15T09:00:00'), description: 'TRUST PAYMENT MAR22', amount: '+R180000.00' },
  { timestamp: new Date('2022-04-15T09:00:00'), description: 'TRUST PAYMENT APR22', amount: '+R220000.00' },
  { timestamp: new Date('2022-05-15T09:00:00'), description: 'TRUST PAYMENT MAY22', amount: '+R190000.00' },
  { timestamp: new Date('2022-06-15T09:00:00'), description: 'TRUST PAYMENT JUN22', amount: '+R250000.00' },
  { timestamp: new Date('2022-07-15T09:00:00'), description: 'TRUST PAYMENT JUL22', amount: '+R210000.00' },
  { timestamp: new Date('2022-08-15T09:00:00'), description: 'TRUST PAYMENT AUG22', amount: '+R230000.00' },
  { timestamp: new Date('2022-09-15T09:00:00'), description: 'TRUST PAYMENT SEP22', amount: '+R200000.00' },
  { timestamp: new Date('2022-10-15T09:00:00'), description: 'TRUST PAYMENT OCT22', amount: '+R260000.00' },
  { timestamp: new Date('2022-11-15T09:00:00'), description: 'TRUST PAYMENT NOV22', amount: '+R240000.00' },
  { timestamp: new Date('2022-12-15T09:00:00'), description: 'TRUST PAYMENT DEC22', amount: '+R300000.00' },
  { timestamp: new Date('2023-01-15T09:00:00'), description: 'TRUST PAYMENT JAN23', amount: '+R220000.00' },
  { timestamp: new Date('2023-02-15T09:00:00'), description: 'TRUST PAYMENT FEB23', amount: '+R250000.00' },
  { timestamp: new Date('2023-03-15T09:00:00'), description: 'TRUST PAYMENT MAR23', amount: '+R230000.00' },
  { timestamp: new Date('2023-04-15T09:00:00'), description: 'TRUST PAYMENT APR23', amount: '+R270000.00' },
  { timestamp: new Date('2023-05-15T09:00:00'), description: 'TRUST PAYMENT MAY23', amount: '+R240000.00' },
  { timestamp: new Date('2023-06-15T09:00:00'), description: 'TRUST PAYMENT JUN23', amount: '+R300000.00' },
  { timestamp: new Date('2023-07-15T09:00:00'), description: 'TRUST PAYMENT JUL23', amount: '+R260000.00' },
  { timestamp: new Date('2023-08-15T09:00:00'), description: 'TRUST PAYMENT AUG23', amount: '+R280000.00' },
  { timestamp: new Date('2023-09-15T09:00:00'), description: 'TRUST PAYMENT SEP23', amount: '+R250000.00' },
  { timestamp: new Date('2023-10-15T09:00:00'), description: 'TRUST PAYMENT OCT23', amount: '+R310000.00' },
  { timestamp: new Date('2023-11-15T09:00:00'), description: 'TRUST PAYMENT NOV23', amount: '+R290000.00' },
  { timestamp: new Date('2023-12-15T09:00:00'), description: 'TRUST PAYMENT DEC23', amount: '+R350000.00' },
  { timestamp: new Date('2024-01-15T09:00:00'), description: 'TRUST PAYMENT JAN24', amount: '+R270000.00' },
  { timestamp: new Date('2024-02-15T09:00:00'), description: 'TRUST PAYMENT FEB24', amount: '+R300000.00' },
  { timestamp: new Date('2024-03-15T09:00:00'), description: 'TRUST PAYMENT MAR24', amount: '+R280000.00' },
  { timestamp: new Date('2024-04-15T09:00:00'), description: 'TRUST PAYMENT APR24', amount: '+R320000.00' },
  { timestamp: new Date('2024-05-15T09:00:00'), description: 'TRUST PAYMENT MAY24', amount: '+R290000.00' },
  { timestamp: new Date('2024-06-15T09:00:00'), description: 'TRUST PAYMENT JUN24', amount: '+R350000.00' },
  { timestamp: new Date('2024-07-15T09:00:00'), description: 'TRUST PAYMENT JUL24', amount: '+R310000.00' },
  
  // Example of a retail purchase and ATM withdrawal with fees
  { timestamp: new Date('2024-07-20T12:30:00'), description: 'WOOLWORTHS SANDTON', amount: '-R2500.00' },
  { timestamp: new Date('2024-07-20T12:30:05'), description: 'FEE: POS_PURCHASE_LOCAL', amount: '-R0.00' },
  { timestamp: new Date('2024-07-25T18:00:00'), description: 'SASWITCH WITHDRAWAL', amount: '-R1000.00' },
  { timestamp: new Date('2024-07-25T18:00:05'), description: 'FEE: ATM_WD_SASW', amount: '-R38.50' }, // 12.00 + (10 * 2.65)
  
  { timestamp: new Date('2024-08-15T09:00:00'), description: 'TRUST PAYMENT AUG24', amount: '+R330000.00' },
  { timestamp: new Date('2024-09-15T09:00:00'), description: 'TRUST PAYMENT SEP24', amount: '+R300000.00' },
  { timestamp: new Date('2024-10-15T09:00:00'), description: 'TRUST PAYMENT OCT24', amount: '+R360000.00' },
  { timestamp: new Date('2024-11-15T09:00:00'), description: 'TRUST PAYMENT NOV24', amount: '+R340000.00' },
  { timestamp: new Date('2024-12-15T09:00:00'), description: 'TRUST PAYMENT DEC24', amount: '+R400000.00' },
  
  // Key events with corrected dates - Note: R20M transfer removed from here as it's part of the initial balance now.
  { timestamp: new Date('2025-08-14T09:00:00'), description: 'INTER-ACCOUNT TRANSFER', amount: '-R18000000.00' },
  { timestamp: new Date('2025-08-14T09:00:05'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
];

// Third account remains simple for now.
export const initialThirdAccountTransactions = [
  { timestamp: new Date('2025-08-10'), description: 'INITIAL DEPOSIT', amount: '+R5000.00' },
  { timestamp: new Date('2025-08-11'), description: 'COFFEE SHOP', amount: '-R75.00' },
  { timestamp: new Date('2025-08-11'), description: 'FEE: POS_PURCHASE_LOCAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-12'), description: 'ONLINE SUBSCRIPTION', amount: '-R150.00' },
  { timestamp: new Date('2025-08-12'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
];
