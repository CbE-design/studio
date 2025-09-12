export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit';
  accountNumber: string;
  balance: number;
  currency: 'USD';
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
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
