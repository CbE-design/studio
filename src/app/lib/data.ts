import type { Account, Transaction, Beneficiary, AtmLocation } from './definitions';

// Note: This data is now primarily for seeding/reference.
// The dashboard and account pages fetch live data from Firestore.
export const accounts: Account[] = [
  {
    id: '1',
    name: 'Savvy Bundle Current Account',
    type: 'Cheque',
    accountNumber: '1234567890',
    balance: 0.00,
    currency: 'ZAR',
  },
  {
    id: '2',
    name: 'CURRENT ACCOUNT',
    type: 'Cheque',
    accountNumber: '1234066912',
    balance: 0.83,
    currency: 'ZAR',
  },
  {
    id: '3',
    name: 'MyPockets(2/10)',
    type: 'Savings',
    accountNumber: '1122334455',
    balance: 4.00,
    currency: 'ZAR',
  },
   {
    id: '4',
    name: 'Savings Account',
    type: 'Savings',
    accountNumber: '0987654321',
    balance: 1250.00,
    currency: 'ZAR',
  },
];

export const transactions: { [key: string]: Transaction[] } = {
  '1': [
     { id: 't1', date: '2025-09-18', description: 'ONLINE PURCHASE', reference: '2069725774', amount: -1740.00, type: 'debit' },
     { id: 't2', date: '2025-09-17', description: 'SALARY', reference: 'ACME CORP', amount: 25000.00, type: 'credit' },
  ],
  '2': [
    { id: 't3', date: '2025-09-18', description: 'PAYMENT TO J DOE', reference: '2069725774', amount: -1740.00, type: 'debit' },
    { id: 't4', date: '2025-09-15', description: 'TRANSFER FROM SAVINGS', reference: 'INTERNAL', amount: 500.00, type: 'credit' },
  ],
  '3': [
     { id: 't5', date: '2025-09-12', description: 'POCKET TRANSFER', reference: 'FOOD', amount: -250.00, type: 'debit' },
  ],
  '4': [
     { id: 't6', date: '2025-09-10', description: 'MONTHLY SAVING', reference: 'AUTO-SAVE', amount: 1000.00, type: 'credit' },
  ],
};

export const beneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'AD De Klerk', bank: 'CAPITEC BANK', accountNumber: '1727255311' },
  { id: 'b2', name: 'A De Klerk', bank: 'AFRICAN BANK', accountNumber: '20033062645' },
  { id: 'b3', name: 'Another A De Klerk', bank: 'AFRICAN BANK', accountNumber: '20033062645' },
  { id: 'b4', name: '08498///96', bank: '', accountNumber: '' },
  { id: 'b5', name: 'Capi Casino', bank: '', accountNumber: '0659272048' },
  { id: 'b6', name: 'coreie', bank: '', accountNumber: '0608797671' },
  { id: 'b7', name: 'DW De Klerk', bank: 'CAPITEC BANK', accountNumber: '1396248844' },
];

export const atmLocations: AtmLocation[] = [
  { id: 'a1', name: 'Main Street Branch', address: '123 Main St, Anytown, USA', services: ['Withdrawal', 'Deposit', 'Balance Inquiry'] },
  { id: 'a2', name: 'Downtown ATM', address: '456 Oak Ave, Anytown, USA', services: ['Withdrawal', 'Balance Inquiry'] },
  { id: 'a3', name: 'Eastside Mall', address: '789 Pine Ln, Anytown, USA', services: ['Withdrawal', 'Deposit'] },
];

export function formatCurrency(amount: number, currency: string = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
