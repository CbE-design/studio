import React, { createContext, useContext, useState } from 'react';
import type { Beneficiary } from '@/lib/definitions';

export type PaymentState = {
  recipient: Beneficiary | null;
  recipientName: string;
  bank: string;
  accountNumber: string;
  paymentType: 'Standard EFT' | 'Instant Pay';
  fromAccountId: string;
  fromAccountName: string;
  fromAccountBalance: number;
  amount: string;
  yourReference: string;
  recipientReference: string;
  notifyEmail: string;
};

const defaultState: PaymentState = {
  recipient: null,
  recipientName: '',
  bank: '',
  accountNumber: '',
  paymentType: 'Standard EFT',
  fromAccountId: '',
  fromAccountName: '',
  fromAccountBalance: 0,
  amount: '',
  yourReference: '',
  recipientReference: '',
  notifyEmail: '',
};

type PaymentContextType = {
  payment: PaymentState;
  setPayment: React.Dispatch<React.SetStateAction<PaymentState>>;
  resetPayment: () => void;
};

const PaymentContext = createContext<PaymentContextType>({
  payment: defaultState,
  setPayment: () => {},
  resetPayment: () => {},
});

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [payment, setPayment] = useState<PaymentState>(defaultState);
  const resetPayment = () => setPayment(defaultState);

  return (
    <PaymentContext.Provider value={{ payment, setPayment, resetPayment }}>
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = () => useContext(PaymentContext);
