'use server';

import 'dotenv/config';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Transaction, TransactionType, Account, User, TransactionInput, TransactionResult } from './definitions';
import { generateConfirmationPdf } from './confirmation-letter-generator';
import { generateProofOfPaymentPdf } from './pop-generator';
import { db as adminDb } from './firebase-admin';
import { createPayment, getAccountWithRealTimeBalance } from './repositories';
import { Resend } from 'resend';
import { format } from 'date-fns';

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

export async function createTransactionAction(data: TransactionInput): Promise<TransactionResult> {
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }

    try {
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber, paymentType } = validatedFields.data;
        
        const txType: TransactionType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';

        const result = await createPayment({
            userId,
            fromAccountId,
            amount: parseFloat(amount),
            recipientName: recipientName || 'RECIPIENT',
            bankName: bankName || undefined,
            accountNumber: accountNumber || undefined,
            yourReference: yourReference || undefined,
            recipientReference: recipientReference || undefined,
            transactionType: txType
        });

        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard');
        
        return { 
            success: true, 
            message: 'Transaction created successfully.',
            transactionId: result.transactionId,
            popReferenceNumber: result.popReferenceNumber
        };

    } catch (error: any) {
        console.error('Transaction Action failed:', error);
        return { 
            success: false, 
            message: error.message || 'An error occurred while creating the transaction.'
        };
    }
}

export async function generateConfirmationLetterAction(
    account: Account,
    user: User
): Promise<Uint8Array | { error: string }> {
    try {
        if (!account || !user) {
            throw new Error("User and account data are required.");
        }
        const pdfBytes = await generateConfirmationPdf(account, user);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate confirmation letter:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
    }
}

export async function generateProofOfPaymentAction(
    transaction: Transaction
): Promise<Uint8Array | { error: string }> {
    try {
        if (!transaction) {
            throw new Error("Transaction data is required.");
        }
        
        const accountData = await getAccountWithRealTimeBalance(transaction.userId!, transaction.fromAccountId!);
        if (!accountData) {
             throw new Error("Account for transaction not found.");
        }

        const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate proof of payment:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
    }
}

export async function sendProofOfPaymentEmailAction(
  transaction: Transaction,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Email service not configured (RESEND_API_KEY missing).');
    }
    const resend = new Resend(resendApiKey);

    const accountData = await getAccountWithRealTimeBalance(transaction.userId!, transaction.fromAccountId!);
    if (!accountData) {
      throw new Error('Account not found.');
    }

    const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
    const base64 = Buffer.from(pdfBytes).toString('base64');

    await resend.emails.send({
      from: 'Nedbank <noreply@notificationsnedbank.co.za>',
      to: recipientEmail,
      subject: `Payment Notification: ${transaction.recipientName || transaction.description}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
          <p>A payment has been made to your account. To view the details of the payment, please open the attached PDF file.</p>
          <p>You may require Adobe Acrobat Reader on your computer to open the PDF file.</p>
          <p>Please do not reply as this email was sent from an unattended mailbox.</p>
        </div>
      `,
      attachments: [
        {
          filename: 'Proof_Of_Payment.pdf',
          content: base64,
        },
      ],
    });

    return { success: true, message: 'Email sent successfully.' };
  } catch (error: any) {
    console.error('Failed to send POP email:', error);
    return { success: false, message: error.message || 'Failed to send email.' };
  }
}

export async function sendEmailAction(data: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured.');
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Nedbank <noreply@notificationsnedbank.co.za>',
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: data.attachments,
    });

    return { success: true, message: 'Email sent successfully.' };
  } catch (error: any) {
    console.error('sendEmailAction failed:', error);
    return { success: false, message: error.message || 'Failed to send email.' };
  }
}

export async function generatePopPdfBase64Action(
    userId: string,
    accountId: string,
    transactionId: string,
): Promise<{ base64: string } | { error: string }> {
    try {
        const txDoc = await adminDb.doc(`users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`).get();
        if (!txDoc.exists) {
            throw new Error("Transaction not found.");
        }
        const transaction = txDoc.data() as Transaction;

        const accountData = await getAccountWithRealTimeBalance(userId, accountId);
        if (!accountData) {
            throw new Error("Account not found.");
        }

        const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
        const base64 = Buffer.from(pdfBytes).toString('base64');
        return { base64 };
    } catch (e: any) {
        console.error("Failed to generate POP PDF base64:", e);
        return { error: e.message || "An unknown error occurred." };
    }
}

export async function markTransactionAsFailedAction(
  userId: string,
  accountId: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const accountRef = adminDb.doc(`users/${userId}/bankAccounts/${accountId}`);
    await adminDb.runTransaction(async (firestoreTransaction) => {
      const txRef = adminDb.doc(`users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`);
      
      const txSnap = await firestoreTransaction.get(txRef);
      const accountSnap = await firestoreTransaction.get(accountRef);

      if (!txSnap.exists) {
        throw new Error('Original transaction not found.');
      }
      if (!accountSnap.exists) {
        throw new Error('Account not found.');
      }
      
      const txData = txSnap.data() as Transaction;
      const accountData = accountSnap.data() as Account;

      const failedTxRef = adminDb.collection(`users/${userId}/bankAccounts/${accountId}/failedTransactions`).doc();
      const newFailedTxData = {
        id: failedTxRef.id,
        returnDate: new Date().toISOString().split('T')[0],
        fromAccount: accountData.accountNumber || 'N/A', 
        toAccount: txData.accountNumber || 'N/A',
        beneficiaryName: txData.recipientName || txData.description,
        failureReason: 'Not Authorised',
        originalAmount: txData.amount,
        originalTransactionId: txData.id,
      };
      firestoreTransaction.set(failedTxRef, newFailedTxData);

      const returnTxRef = adminDb.collection(`users/${userId}/bankAccounts/${accountId}/transactions`).doc();
      const returnTxData: Transaction = {
          id: returnTxRef.id,
          userId: userId,
          fromAccountId: accountId,
          amount: txData.amount, 
          type: 'credit',
          transactionType: 'EFT_STANDARD', 
          date: new Date().toISOString(),
          description: `RETURN: ${txData.description}`,
          recipientName: 'SELF',
      };
      firestoreTransaction.set(returnTxRef, returnTxData);
      
      const newBalance = accountData.balance + txData.amount;
      firestoreTransaction.update(accountRef, { balance: newBalance });
    });

    revalidatePath(`/account/${accountId}`);
    revalidatePath(`/account/${accountId}/transaction/${transactionId}`);
    return { success: true, message: 'Transaction successfully marked as returned and funds reversed.' };
  } catch (error: any) {
    console.error('Failed to mark transaction as failed:', error);
    return { success: false, message: error.message || 'Failed to mark transaction as failed.' };
  }
}

const InternalTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
  userId: z.string().min(1),
  reference: z.string().optional(),
});

export async function createInternalTransferAction(data: z.infer<typeof InternalTransferSchema>): Promise<{ success: boolean; message: string }> {
  const validatedFields = InternalTransferSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid fields provided.',
    };
  }

  const { fromAccountId, toAccountId, amount, userId, reference } = validatedFields.data;
  const numericAmount = parseFloat(amount);

  if (fromAccountId === toAccountId) {
    return { success: false, message: "Cannot transfer to the same account." };
  }

  const fromAccountRef = adminDb.doc(`users/${userId}/bankAccounts/${fromAccountId}`);
  const toAccountRef = adminDb.doc(`users/${userId}/bankAccounts/${toAccountId}`);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const fromDoc = await transaction.get(fromAccountRef);
      const toDoc = await transaction.get(toAccountRef);

      if (!fromDoc.exists || !toDoc.exists) {
        throw new Error("One or both accounts not found.");
      }

      const fromData = fromDoc.data() as Account;
      const toData = toDoc.data() as Account;

      if (fromData.balance < numericAmount) {
        throw new Error("Insufficient funds.");
      }

      transaction.update(fromAccountRef, { balance: fromData.balance - numericAmount });
      transaction.update(toAccountRef, { balance: toData.balance + numericAmount });

      const now = new Date().toISOString();
      const transferDescription = `TRANSFER TO ${toData.name.toUpperCase()}`;
      const receiveDescription = `TRANSFER FROM ${fromData.name.toUpperCase()}`;

      const fromTxRef = fromAccountRef.collection('transactions').doc();
      transaction.set(fromTxRef, {
        id: fromTxRef.id,
        userId: userId,
        fromAccountId: fromAccountId,
        date: now,
        description: transferDescription,
        amount: numericAmount,
        type: 'debit',
        transactionType: 'SAVINGS_TRANSFER',
        yourReference: reference,
        recipientName: toData.name
      });

      const toTxRef = toAccountRef.collection('transactions').doc();
      transaction.set(toTxRef, {
        id: toTxRef.id,
        userId: userId,
        fromAccountId: toAccountId,
        date: now,
        description: receiveDescription,
        amount: numericAmount,
        type: 'credit',
        transactionType: 'SAVINGS_TRANSFER',
        yourReference: reference,
        recipientName: fromData.name,
      });
    });

    revalidatePath('/dashboard');
    revalidatePath(`/account/${fromAccountId}`);
    revalidatePath(`/account/${toAccountId}`);

    return { success: true, message: 'Transfer successful!' };

  } catch (error: any) {
    console.error('Internal transfer failed:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}
