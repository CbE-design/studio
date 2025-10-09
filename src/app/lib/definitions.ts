
export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit' | 'Student';
  accountNumber: string;
  balance: number;
  currency: 'USD' | 'ZAR';
  userId?: string;
};

export type TransactionType = 'EFT_IMMEDIATE' | 'EFT_STANDARD' | 'POS_PURCHASE' | 'ATM_WITHDRAWAL_OWN' | 'ATM_WITHDRAWAL_OTHER' | 'DEBIT_ORDER' | 'BANK_FEE';

export type Transaction = {
  id: string;
  fromAccountId?: string;
  userId?: string; // Add userId to link transaction to the user
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  transactionType?: TransactionType;
  reference?: string;
  recipientName?: string | null;
  yourReference?: string;
  recipientReference?: string;
  bank?: string;
  accountNumber?: string;
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

export type User = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
}

    
