'use server';

import { db } from './firebase-admin';
import { fetchCbsAccountBalance } from './cbs-service';
import { syncTransactionToSap } from './sap-service';
import type { Account, Transaction, IntegrationAuditLog, TransactionType } from './definitions';
import { format } from 'date-fns';
import { calculateFee } from './fees';

/**
 * @fileOverview Data Repositories
 * Centralizes data access and integration workflows for CBS and SAP.
 */

export class AuditRepository {
  static async log(log: Omit<IntegrationAuditLog, 'id' | 'timestamp'>) {
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
}

export class AccountRepository {
  static async getAccountWithRealTimeBalance(userId: string, accountId: string): Promise<Account | null> {
    const accountRef = db.doc(`users/${userId}/bankAccounts/${accountId}`);
    const doc = await accountRef.get();

    if (!doc.exists) return null;

    const accountData = { id: doc.id, ...doc.data() } as Account;

    // Reconciliation: If CBS is available, we treat it as the source of truth for balance
    try {
      const cbsBalance = await fetchCbsAccountBalance(accountData.accountNumber);
      if (cbsBalance !== accountData.balance) {
        console.log(`[AccountRepository] Reconciling balance for ${accountData.accountNumber}: ${accountData.balance} -> ${cbsBalance}`);
        await accountRef.update({ balance: cbsBalance });
        accountData.balance = cbsBalance;
        
        await AuditRepository.log({
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
}

export class TransactionRepository {
  static async createPayment(input: {
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
      const totalDebit = amount + feeAmount;

      if (accountData.balance < totalDebit) throw new Error("Insufficient funds (including fees).");

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
        popSecurityCode: Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')
      };

      dbTransaction.set(txRef, mainTx);

      if (feeAmount > 0) {
        const feeTxRef = accountRef.collection('transactions').doc();
        dbTransaction.set(feeTxRef, {
          id: feeTxRef.id,
          userId,
          fromAccountId,
          date: new Date().toISOString(),
          amount: feeAmount,
          type: 'debit',
          transactionType: 'BANK_FEE',
          description: feeDescription,
        });
      }

      dbTransaction.update(accountRef, { balance: accountData.balance - totalDebit });
    });

    // Post-transaction Integrations
    if (resultTransactionId) {
      // 1. CBS Notification (Assumed handled by the transaction above or an external trigger)
      
      // 2. SAP NetWeaver Reconciliation
      const sapSynced = await syncTransactionToSap(resultTransactionId);
      await AuditRepository.log({
        system: 'SAP',
        action: 'LEDGER_SYNC',
        status: sapSynced ? 'SUCCESS' : 'FAILURE',
        details: `Sync transaction ${resultTransactionId} to General Ledger`,
        userId
      });
    }

    return { transactionId: resultTransactionId, popReferenceNumber: resultPopRef };
  }
}
