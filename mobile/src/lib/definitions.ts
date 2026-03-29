export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit';
  accountNumber: string;
  balance: number;
  currency: 'USD' | 'ZAR';
  userId?: string;
};

export type TransactionType =
  | 'EFT_IMMEDIATE'
  | 'EFT_STANDARD'
  | 'POS_PURCHASE'
  | 'ATM_WITHDRAWAL_OWN'
  | 'ATM_WITHDRAWAL_OTHER'
  | 'DEBIT_ORDER'
  | 'BANK_FEE'
  | 'SAVINGS_TRANSFER';

export type Transaction = {
  id: string;
  fromAccountId?: string;
  userId?: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  transactionType?: TransactionType;
  reference?: string;
  recipientName?: string;
  yourReference?: string;
  recipientReference?: string;
  bank?: string;
  accountNumber?: string;
  popReferenceNumber?: string;
  popSecurityCode?: string;
  status?: 'PENDING_APPROVAL' | 'SUCCESS' | 'FAILED' | 'REJECTED';
};

export type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  phoneNumber?: string;
};

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string | null;
};

export type ApprovalRequest = {
  id: string;
  initiatorName: string;
  amount: number;
  recipientName: string;
  date: string;
  reference: string;
  accountNumber: string;
  bankName: string;
};

export type TransactionInput = {
  fromAccountId: string;
  userId: string;
  amount: string;
  recipientName?: string;
  yourReference?: string;
  recipientReference?: string;
  bankName?: string;
  accountNumber?: string;
  paymentType: string;
};

export type TransactionResult = {
  success: boolean;
  message: string;
  transactionId?: string;
  popReferenceNumber?: string;
  errors?: Record<string, string[]>;
};
