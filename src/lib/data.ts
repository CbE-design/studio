export const MOCK_CURRENT_DATE = new Date('2025-08-17T23:02:00');

const originalTransactions = [
  { timestamp: new Date('2024-10-01'), description: 'Hantie lening', amount: '+R25000.00' },
  { timestamp: new Date('2024-10-01'), description: 'A De Klerk', amount: '-R2000.00' },
  { timestamp: new Date('2024-10-01'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2024-10-01'), description: 'PnP Crp Wonder377121716833693', amount: '-R1535.76' },
  { timestamp: new Date('2024-11-03'), description: 'Hantie lening', amount: '+R15000.00' },
  { timestamp: new Date('2024-11-03'), description: 'blom', amount: '-R5000.00' },
  { timestamp: new Date('2024-11-03'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2024-12-05'), description: 'CORRIE', amount: '+R420000.00' },
  { timestamp: new Date('2024-12-05'), description: 'BR CASH R420000.00 FEE', amount: '-R9660.00' },
  { timestamp: new Date('2025-01-06'), description: 'W.Joubert', amount: '-R29000.00' },
  { timestamp: new Date('2025-01-06'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-02-07'), description: 'Hantie lening', amount: '+R25000.00' },
  { timestamp: new Date('2025-03-10'), description: 'J VAN NIEKERK', amount: '+R700.00' },
  { timestamp: new Date('2025-04-11'), description: 'Wynand', amount: '+R5000.00' },
  { timestamp: new Date('2025-05-12'), description: 'Hantie lening', amount: '+R10000.00' },
  { timestamp: new Date('2025-06-17'), description: 'Hantie lening', amount: '+R7000.00' },
  { timestamp: new Date('2025-06-17'), description: 'H.Nel', amount: '-R6000.00' },
  { timestamp: new Date('2025-06-17'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-07-18'), description: 'MAKRO WONDERBO377121716833693', amount: '-R9594.00' },
  { timestamp: new Date('2025-07-20'), description: 'Hantie lening', amount: '+R55000.00' },
  { timestamp: new Date('2025-07-21'), description: 'H.Nel', amount: '-R4000.00' },
  { timestamp: new Date('2025-07-21'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-07-25'), description: 'Wynand', amount: '+R5000.00' },
  { timestamp: new Date('2025-07-27'), description: 'FEE: MONTHLY', amount: '-R122.00' },
  { timestamp: new Date('2025-07-29'), description: 'Hantie lening', amount: '+R13000.00' },
  { timestamp: new Date('2025-07-31'), description: 'Ida', amount: '+R3000.00' },
  { timestamp: new Date('2025-08-01'), description: 'ATM CASH 377121716833693', amount: '-R3000.00' },
  { timestamp: new Date('2025-08-01'), description: 'FEE: ATM_WD_NED', amount: '-R0.00' }, // In-bundle
  { timestamp: new Date('2025-08-03'), description: 'Wynand', amount: '+R3000.00' },
  { timestamp: new Date('2025-08-07'), description: '24HOURCASH', amount: '+R16100.00' },
  { timestamp: new Date('2025-08-08'), description: 'JOSCA MOTORS', amount: '+R35000.00' },
  { timestamp: new Date('2025-08-09'), description: 'SASW CASH 377121716833693', amount: '-R4000.00' },
  { timestamp: new Date('2025-08-09'), description: 'FEE: ATM_WD_SASW', amount: '-R118.60' }, // 12 + 2.65 * 40
];

const filteredOriginalTransactions = originalTransactions.filter(
  (tx) => !tx.description.includes('PEERMONT') && !tx.description.includes('TIME SQUARE')
);

const recentSimulatedTransactions = [
  { timestamp: new Date('2025-01-15'), description: 'CHECKERS MONTANA', amount: '-R2105.45' },
  { timestamp: new Date('2025-03-20'), description: 'CITY OF TSHWANE', amount: '-R4500.00' },
  { timestamp: new Date('2025-03-20'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
  { timestamp: new Date('2025-06-10'), description: 'DISCOVERY MEDICAL AID', amount: '-R6800.00' },
  { timestamp: new Date('2025-06-10'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
  { timestamp: new Date('2025-07-01'), description: 'OUTSURANCE PREMIUM', amount: '-R1850.00' },
  { timestamp: new Date('2025-07-01'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
  { timestamp: new Date('2025-07-25'), description: 'TAKEALOT ONLINE', amount: '-R980.00' },
  { timestamp: new Date('2025-08-01'), description: 'FLYSAFAIR FLIGHT JHB-CPT', amount: '-R2350.00' },
  { timestamp: new Date('2025-08-05'), description: 'NETFLIX SUBSCRIPTION', amount: '-R199.00' },
  { timestamp: new Date('2025-08-08'), description: 'ADIDAS ONLINE STORE', amount: '-R1899.00' },
  { timestamp: new Date('2025-08-10'), description: 'J. SMITH', amount: '-R15000.00' },
  { timestamp: new Date('2025-08-10'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-12'), description: 'SHELL ULTRA CITY', amount: '-R950.00' },
  { timestamp: new Date('2025-08-18'), description: 'FRANSISKA MEIRING', amount: '-R500000.00' },
  { timestamp: new Date('2025-08-18'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
];

const initialTrustAndIsraelTransactions = [
  { timestamp: new Date('2025-07-28'), description: 'EL AL ISRAEL AIRLINES', amount: '-R18450.30' },
  { timestamp: new Date('2025-07-28'), description: 'CARLTON TEL AVIV HOTEL', amount: '-R12500.00' },
  { timestamp: new Date('2025-07-29'), description: 'FOREX PURCHASE ILS', amount: '-R25000.00' },
  { timestamp: new Date('2025-07-30'), description: 'RESTAURANT TEL AVIV', amount: '-R2340.50' },
  { timestamp: new Date('2025-08-01'), description: 'ATM W/D BANK HAPOALIM', amount: '-R4680.00' },
  { timestamp: new Date('2025-08-01'), description: 'FEE: ATM_WD_INTL', amount: '-R189.05' }, // 65 + 2.65 * 47
  { timestamp: new Date('2025-08-02'), description: 'INVESTEC PROPERTY FUND DIV', amount: '+R75000.00' },
  { timestamp: new Date('2025-08-03'), description: 'LEGAL FEES - SMITH INC', amount: '-R35000.00' },
  { timestamp: new Date('2025-08-03'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-05'), description: 'WOOLWORTHS SANDTON', amount: '-R3450.80' },
  { timestamp: new Date('2025-08-06'), description: 'DSV COURIERS', amount: '-R850.00' },
  { timestamp: new Date('2025-08-13'), description: 'CORRIE', amount: '-R15000.00' },
  { timestamp: new Date('2025-08-13'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-14'), description: 'TRANSFER FROM PLATINUM', amount: '+R18000000.00' },
  { timestamp: new Date('2025-08-15'), description: 'MFOLOE ATTORNEYS INC', amount: '-R16300000.00' },
  { timestamp: new Date('2025-08-15'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-16'), description: 'PAYMENT REVERSED: MFOLOE ATTORNEYS INC', amount: '+R16300000.00' },
  { timestamp: new Date('2025-08-19'), description: 'PAYMENT REVERSED: FRANSISKA MEIRING', amount: '+R500000.00' },
];

export const combinedInitialTransactions = [
  ...filteredOriginalTransactions,
  ...initialTrustAndIsraelTransactions,
  ...recentSimulatedTransactions,
];

export const initialPlatinumChequeTransactions = [
  { timestamp: new Date('2025-08-15'), description: 'VAN SCHALKWYK FAMILY TRUST', amount: '+R18000000.00' },
  { timestamp: new Date('2025-08-15'), description: 'TRANSFER TO SAVVY', amount: '-R18000000.00' },
  { timestamp: new Date('2025-08-15'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-07-26'), description: 'ALLAN GRAY PTY LTD', amount: '-R500000.00' },
  { timestamp: new Date('2025-07-26'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-07-29'), description: 'SARS EFILING PAYMENT', amount: '-R250000.00' },
  { timestamp: new Date('2025-07-29'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-02'), description: 'PROPERTY TRANSFER - JHB', amount: '-R1250000.00' },
  { timestamp: new Date('2025-08-02'), description: 'FEE: EFT_PAY_DIGITAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-05'), description: 'MERCEDES-BENZ SANDTON', amount: '-R28500.00' },
  { timestamp: new Date('2025-08-05'), description: 'FEE: POS_PURCHASE_LOCAL', amount: '-R0.00' },
];

export const initialThirdAccountTransactions = [
  { timestamp: new Date('2025-08-10'), description: 'INITIAL DEPOSIT', amount: '+R5000.00' },
  { timestamp: new Date('2025-08-11'), description: 'COFFEE SHOP', amount: '-R75.00' },
  { timestamp: new Date('2025-08-11'), description: 'FEE: POS_PURCHASE_LOCAL', amount: '-R0.00' },
  { timestamp: new Date('2025-08-12'), description: 'ONLINE SUBSCRIPTION', amount: '-R150.00' },
  { timestamp: new Date('2025-08-12'), description: 'FEE: DEBIT_ORD_EXT', amount: '-R0.00' },
];
