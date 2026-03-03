import { z } from "zod";

export type Account = {
  id: string;
  name: string;
  type: 'Cheque' | 'Savings' | 'Credit';
  accountNumber: string;
  balance: number;
  currency: 'USD' | 'ZAR';
  userId?: string;
};

export type TransactionType = 'EFT_IMMEDIATE' | 'EFT_STANDARD' | 'POS_PURCHASE' | 'ATM_WITHDRAWAL_OWN' | 'ATM_WITHDRAWAL_OTHER' | 'DEBIT_ORDER' | 'BANK_FEE' | 'SAVINGS_TRANSFER';

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
};

export type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  phoneNumber?: string;
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
    createdAt: any;
}

export type CbsStatus = {
  connected: boolean;
  systemName: string;
  latency: string;
  lastSync: string;
  environment: 'Production' | 'Sandbox' | 'Mock';
};

export type IntegrationAuditLog = {
  id: string;
  timestamp: string;
  system: 'CBS' | 'SAP' | 'FIREBASE';
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  details: string;
  userId: string;
};

const TransactionSchema = z.object({
    fromAccountId: z.string().min(1, { message: 'From Account is required.'}),
    userId: z.string().min(1, { message: 'User ID is required.'}),
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    paymentType: z.string(), 
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

export type TransactionResult = {
  success: boolean;
  message: string;
  transactionId?: string;
  popReferenceNumber?: string;
  errors?: any;
};
