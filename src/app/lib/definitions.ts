export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit';
  accountNumber: string;
  balance: number;
  currency: 'USD' | 'ZAR';
  userId?: string;
};

export type Transaction = {
  id: string;
  fromAccountId?: string;
  userId?: string; // Add userId to link transaction to the user
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  recipientName?: string;
  yourReference?: string;
  recipientReference?: string;
};

export type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
};

export type AtmLocation = {
  id: string;
  name: string;
  address: string;
  services: string[];
};

export type Bank = {
  name: string;
  popular: boolean;
};
