export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit';
  accountNumber: string;
  balance: number;
  currency: 'USD' | 'ZAR';
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference: string;
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
