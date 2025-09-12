import type { Account, Transaction, Beneficiary, AtmLocation } from './definitions';

export const accounts: Account[] = [
  {
    id: '1',
    name: 'Primary Cheque Account',
    type: 'Cheque',
    accountNumber: '**** **** **** 1234',
    balance: 12540.75,
    currency: 'USD',
  },
  {
    id: '2',
    name: 'Everyday Savings',
    type: 'Savings',
    accountNumber: '**** **** **** 5678',
    balance: 8230.0,
    currency: 'USD',
  },
  {
    id: '3',
    name: 'Platinum Credit Card',
    type: 'Credit',
    accountNumber: '**** **** **** 9012',
    balance: -2150.5,
    currency: 'USD',
  },
];

export const transactions: { [key: string]: Transaction[] } = {
  '1': [
    { id: 't1', date: '2024-07-28', description: 'Online Shopping - Amazon', amount: -120.5, type: 'debit' },
    { id: 't2', date: '2024-07-27', description: 'Salary Deposit', amount: 5000.0, type: 'credit' },
    { id: 't3', date: '2024-07-26', description: 'Grocery Store', amount: -75.25, type: 'debit' },
    { id: 't4', date: '2024-07-25', description: 'Transfer to Savings', amount: -1000.0, type: 'debit' },
    { id: 't5', date: '2024-07-24', description: 'Netflix Subscription', amount: -15.99, type: 'debit' },
    { id: 't6', date: '2024-07-23', description: 'Gas Station', amount: -55.0, type: 'debit' },
  ],
  '2': [
    { id: 't7', date: '2024-07-25', description: 'Transfer from Cheque', amount: 1000.0, type: 'credit' },
    { id: 't8', date: '2024-07-15', description: 'Interest Payment', amount: 12.3, type: 'credit' },
  ],
  '3': [
    { id: 't9', date: '2024-07-26', description: 'Restaurant - The Grand', amount: -150.0, type: 'debit' },
    { id: 't10', date: '2024-07-22', description: 'Payment Received', amount: 500.0, type: 'credit' },
  ],
};

export const beneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'John Doe - Electricity', bank: 'City Bank', accountNumber: '**** 1122' },
  { id: 'b2', name: 'Jane Smith - Water', bank: 'State Bank', accountNumber: '**** 3344' },
  { id: 'b3', name: 'Utility Co - Gas', bank: 'National Bank', accountNumber: '**** 5566' },
];

export const atmLocations: AtmLocation[] = [
  { id: 'a1', name: 'Main Street Branch', address: '123 Main St, Anytown, USA', services: ['Withdrawal', 'Deposit', 'Balance Inquiry'] },
  { id: 'a2', name: 'Downtown ATM', address: '456 Oak Ave, Anytown, USA', services: ['Withdrawal', 'Balance Inquiry'] },
  { id: 'a3', name: 'Eastside Mall', address: '789 Pine Ln, Anytown, USA', services: ['Withdrawal', 'Deposit'] },
];

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
