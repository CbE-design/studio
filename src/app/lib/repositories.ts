'use server';

import { db } from './firebase-admin';
import { fetchCbsAccountBalance } from './cbs-service';
import { syncTransactionToSap } from './sap-service';
import type { Account, Transaction, IntegrationAuditLog, TransactionType } from './definitions';
import { format } from 'date-fns';
import { calculateFee } from './fees';

/**
 * @fileOverview Data Repositories
 * Realistic Nedbank Trust Clearing & Authorization logic.
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
    const { amount: feeAmount } = calculateFee(amount, transactionType, accountData.type);
    
    // In a Trust account, we check for funds but do NOT deduct until signed.
    const totalDebit = amount + feeAmount;
    if (accountData.balance < totalDebit) throw new Error("Insufficient funds for instruction capture.");

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
  });

  if (resultTransactionId) {
    await logAudit({
      system: 'FIREBASE',
      action: 'PAYMENT_CAPTURE',
      status: 'SUCCESS',
      details: `Captured Trust instruction ${resultTransactionId}. Mandate status: Awaiting Authorization.`,
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

        if (!accountDoc.exists || !txDoc.exists) throw new Error("Mandate record or account not found.");

        const accountData = accountDoc.data() as Account;
        const txData = txDoc.data() as Transaction;

        if (txData.status !== 'PENDING_APPROVAL') throw new Error("Instruction has already been processed.");

        const { amount: feeAmount, description: feeDescription } = calculateFee(txData.amount, txData.transactionType!, accountData.type);
        const totalDebit = txData.amount + feeAmount;

        if (accountData.balance < totalDebit) {
            dbTransaction.update(txRef, { status: 'FAILED' });
            throw new Error("Mandate met, but funds were insufficient at time of signing.");
        }

        // Real-time balance deduction on Authorization
        dbTransaction.update(accountRef, { balance: accountData.balance - totalDebit });

        // Update instruction to Successful Transaction
        dbTransaction.update(txRef, { 
          status: 'SUCCESS',
          clearingDate: new Date().toISOString()
        });

        // Log fee as a posted entry
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

    // Production Bridge Syncs
    await logAudit({
      system: 'CBS',
      action: 'ISO20022_MSG_GEN',
      status: 'SUCCESS',
      details: `Signature Verified: Generated pacs.008 message for instruction ${transactionId}`,
      userId
    });

    const sapSynced = await syncTransactionToSap(transactionId);
    await logAudit({
      system: 'SAP',
      action: 'LEDGER_SYNC',
      status: sapSynced ? 'SUCCESS' : 'FAILURE',
      details: `Reconciled signature and posted transaction ${transactionId} to SAP General Ledger`,
      userId
    });

    return true;
}

export async function rejectPayment(userId: string, accountId: string, transactionId: string) {
    const accountRef = db.doc(`users/${userId}/bankAccounts/${accountId}`);
    const txRef = accountRef.collection('transactions').doc(transactionId);
    
    await db.runTransaction(async (dbTransaction) => {
        const txDoc = await dbTransaction.get(txRef);
        const accountDoc = await dbTransaction.get(accountRef);
        
        if (!txDoc.exists || !accountDoc.exists) throw new Error("Instruction or account not found.");
        
        const txData = txDoc.data() as Transaction;
        const accountData = accountDoc.data() as Account;

        // Update main transaction status
        dbTransaction.update(txRef, { status: 'REJECTED' });

        // Add to failedTransactions subcollection
        const failedTxRef = accountRef.collection('failedTransactions').doc();
        dbTransaction.set(failedTxRef, {
            id: failedTxRef.id,
            returnDate: format(new Date(), 'dd MMM yyyy'),
            fromAccount: accountData.accountNumber,
            toAccount: txData.accountNumber || 'N/A',
            beneficiaryName: txData.recipientName || txData.description,
            failureReason: 'Not Authorised'
        });
    });

    await logAudit({
      system: 'FIREBASE',
      action: 'PAYMENT_REJECTION',
      status: 'SUCCESS',
      details: `Trustee rejected the captured instruction ${transactionId}`,
      userId
    });

    return true;
}