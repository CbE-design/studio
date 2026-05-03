'use server';

import { db } from './firebase-admin';
import { fetchCbsAccountBalance } from './cbs-service';
import { syncTransactionToSap } from './sap-service';
import type { Account, Transaction, IntegrationAuditLog, TransactionType } from './definitions';
import { format } from 'date-fns';
import { calculateFee } from './fees';

/**
 * @fileOverview Data Repositories
 * Refactored to standalone functions to satisfy Next.js "use server" requirements.
 */

export async function logAudit(log: Omit<IntegrationAuditLog, 'id' | 'timestamp'>) {
  try {
    const logRef = db.collection('audit_logs').doc();
    await logRef.set({
      ...log,
      id: logRef.id,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[AuditRepository] Failed to write log:', e);
  }
}

export async function getAccountWithRealTimeBalance(userId: string, accountId: string): Promise<Account | null> {
  const accountRef = db.doc(`users/${userId}/bankAccounts/${accountId}`);
  const doc = await accountRef.get();

  if (!doc.exists) return null;

  const accountData = { id: doc.id, ...doc.data() } as Account;

  try {
    const cbsBalance = await fetchCbsAccountBalance(accountData.accountNumber);
    if (cbsBalance !== accountData.balance && cbsBalance > 0) {
      console.log(`[AccountRepository] Reconciling balance for ${accountData.accountNumber}: ${accountData.balance} -> ${cbsBalance}`);
      await accountRef.update({ balance: cbsBalance });
      accountData.balance = cbsBalance;
      
      await logAudit({
        system: 'CBS',
        action: 'BALANCE_RECONCILIATION',
        status: 'SUCCESS',
        details: `Reconciled balance from CBS for account ${accountData.accountNumber}`,
        userId
      });
    }
  } catch (e) {
    console.warn('[AccountRepository] Could not reconcile with CBS, falling back to local data.');
  }

  return accountData;
}

export async function createPayment(input: {
  userId: string;
  fromAccountId: string;
  amount: number;
  recipientName: string;
  bankName?: string;
  accountNumber?: string;
  yourReference?: string;
  recipientReference?: string;
  transactionType: TransactionType;
}) {
  const { userId, fromAccountId, amount, transactionType } = input;
  const accountRef = db.doc(`users/${userId}/bankAccounts/${fromAccountId}`);
  
  let resultTransactionId: string | undefined;
  let resultPopRef: string | undefined;

  await db.runTransaction(async (dbTransaction) => {
    const accountDoc = await dbTransaction.get(accountRef);
    if (!accountDoc.exists) throw new Error("Source account not found.");

    const accountData = accountDoc.data() as Account;
    const { amount: feeAmount, description: feeDescription } = calculateFee(amount, transactionType, accountData.type);
    
    // In a trust account, we capture the instruction as PENDING_APPROVAL.
    // We don't deduct funds yet, but we check if the instruction is valid.
    const totalDebit = amount + feeAmount;
    if (accountData.balance < totalDebit) throw new Error("Insufficient funds for capture.");

    const txRef = accountRef.collection('transactions').doc();
    resultTransactionId = txRef.id;
    
    const popReferenceNumber = `${format(new Date(), 'yyyy-MM-dd')}/NEDBANK/${Math.random().toString().substring(2, 14)}`;
    resultPopRef = popReferenceNumber;
    
    const mainTx: Transaction = {
      id: txRef.id,
      userId,
      fromAccountId,
      date: new Date().toISOString(),
      amount,
      type: 'debit',
      transactionType,
      description: input.recipientName.toUpperCase(),
      recipientName: input.recipientName.toUpperCase(),
      bank: input.bankName,
      accountNumber: input.accountNumber,
      yourReference: input.yourReference,
      recipientReference: input.recipientReference,
      popReferenceNumber,
      status: 'PENDING_APPROVAL',
      popSecurityCode: Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')
    };

    dbTransaction.set(txRef, mainTx);
    
    // Fees are also held in pending state until execution
  });

  if (resultTransactionId) {
    await logAudit({
      system: 'FIREBASE',
      action: 'PAYMENT_CAPTURE',
      status: 'SUCCESS',
      details: `Captured payment instruction ${resultTransactionId} awaiting Trustee authorization.`,
      userId
    });
  }

  return { transactionId: resultTransactionId, popReferenceNumber: resultPopRef };
}

export async function processAuthorizedPayment(userId: string, accountId: string, transactionId: string) {
    const accountRef = db.doc(`users/${userId}/bankAccounts/${accountId}`);
    const txRef = accountRef.collection('transactions').doc(transactionId);

    await db.runTransaction(async (dbTransaction) => {
        const accountDoc = await dbTransaction.get(accountRef);
        const txDoc = await dbTransaction.get(txRef);

        if (!accountDoc.exists || !txDoc.exists) throw new Error("Record not found.");

        const accountData = accountDoc.data() as Account;
        const txData = txDoc.data() as Transaction;

        if (txData.status !== 'PENDING_APPROVAL') throw new Error("Transaction is not in a pending state.");

        const { amount: feeAmount, description: feeDescription } = calculateFee(txData.amount, txData.transactionType!, accountData.type);
        const totalDebit = txData.amount + feeAmount;

        if (accountData.balance < totalDebit) {
            dbTransaction.update(txRef, { status: 'FAILED' });
            throw new Error("Insufficient funds at time of authorization.");
        }

        // Deduct balance
        dbTransaction.update(accountRef, { balance: accountData.balance - totalDebit });

        // Update main transaction status
        dbTransaction.update(txRef, { status: 'SUCCESS' });

        // Create fee record if applicable
        if (feeAmount > 0) {
            const feeTxRef = accountRef.collection('transactions').doc();
            dbTransaction.set(feeTxRef, {
                id: feeTxRef.id,
                userId,
                fromAccountId: accountId,
                date: new Date().toISOString(),
                amount: feeAmount,
                type: 'debit',
                transactionType: 'BANK_FEE',
                description: feeDescription,
                status: 'SUCCESS'
            });
        }
    });

    // Real-time integration syncs
    await logAudit({
      system: 'CBS',
      action: 'ISO20022_MSG_GEN',
      status: 'SUCCESS',
      details: `Authorized: Generated pacs.008 ISO 20022 message for ${transactionId}`,
      userId
    });

    const sapSynced = await syncTransactionToSap(transactionId);
    await logAudit({
      system: 'SAP',
      action: 'LEDGER_SYNC',
      status: sapSynced ? 'SUCCESS' : 'FAILURE',
      details: `Authorized: Reconciled transaction ${transactionId} to SAP General Ledger`,
      userId
    });

    return true;
}

export async function rejectPayment(userId: string, accountId: string, transactionId: string) {
    const txRef = db.doc(`users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`);
    await txRef.update({ status: 'REJECTED' });
    
    await logAudit({
      system: 'FIREBASE',
      action: 'PAYMENT_REJECTION',
      status: 'SUCCESS',
      details: `Trustee rejected payment instruction ${transactionId}`,
      userId
    });

    return true;
}
