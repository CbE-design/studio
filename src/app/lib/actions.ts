
'use server';

import 'dotenv/config';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Transaction, TransactionType, Account, User, TransactionInput, TransactionResult, State } from './definitions';
import { calculateFee } from './fees';
import { generateConfirmationPdf } from './confirmation-letter-generator';
import { generateProofOfPaymentPdf } from './pop-generator';
import { db as adminDb } from './firebase-admin';
import { format } from 'date-fns';
import { formatCurrency } from './data';
import { getPersonalizedFinancialTips } from '@/ai/flows/personalized-financial-tips';
import { getFunctions, httpsCallable } from 'firebase/functions';

const TransactionSchema = z.object({
    fromAccountId: z.string().min(1, { message: 'From Account is required.'}),
    userId: z.string().min(1, { message: 'User ID is required.'}),
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    paymentType: z.string(), // e.g. 'Instant Pay', 'Standard EFT'
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
        let mainTxId: string | undefined;
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber, paymentType } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        const transactionType: TransactionType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';

        const generateRandomSuffix = (length: number) => Math.random().toString().substring(2, 2 + length);
        const generateSecurityCode = () => Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
        
        const accountRef = adminDb.doc(`users/${userId}/bankAccounts/${fromAccountId}`);
        
        await adminDb.runTransaction(async (transaction) => {
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists) {
                throw new Error("Account not found.");
            }

            const accountData = accountDoc.data() as Account;
            const currentBalance = accountData.balance || 0;
            
            const { amount: feeAmount, description: feeDescription } = calculateFee(numericAmount, transactionType, accountData.type);

            const totalDebit = numericAmount + feeAmount;
            if (currentBalance < totalDebit) {
                throw new Error("Insufficient funds to complete the transaction and cover fees.");
            }
            
            const newBalance = currentBalance - totalDebit;
            
            const newTransactionRef = adminDb.collection(`users/${userId}/bankAccounts/${fromAccountId}/transactions`).doc();
            mainTxId = newTransactionRef.id;
            
            const popReferenceNumber = `${format(new Date(), 'yyyy-MM-dd')}/NEDBANK/${generateRandomSuffix(12)}`;
            const popSecurityCode = generateSecurityCode();

            const mainTransactionData: Transaction = {
                id: newTransactionRef.id,
                userId: userId,
                fromAccountId: fromAccountId,
                amount: numericAmount,
                type: 'debit' as const,
                transactionType: transactionType,
                date: new Date().toISOString(),
                description: (recipientName || 'RECIPIENT').toUpperCase(),
                recipientName: recipientName ? recipientName.toUpperCase() : null,
                yourReference: yourReference || null,
                recipientReference: recipientReference || null,
                bank: bankName || null,
                accountNumber: accountNumber || null,
                popReferenceNumber,
                popSecurityCode
            };
            transaction.set(newTransactionRef, mainTransactionData);

            if (feeAmount > 0) {
                const feeTransactionRef = adminDb.collection(`users/${userId}/bankAccounts/${fromAccountId}/transactions`).doc();
                const feeTransactionData = {
                    id: feeTransactionRef.id,
                    userId: userId,
                    fromAccountId: fromAccountId,
                    amount: feeAmount,
                    type: 'debit' as const,
                    transactionType: 'BANK_FEE' as TransactionType,
                    date: new Date().toISOString(),
                    description: feeDescription,
                };
                transaction.set(feeTransactionRef, feeTransactionData);
            }

            transaction.update(accountRef, { balance: newBalance });
        });

        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard');
        
        return { 
            success: true, 
            message: 'Transaction created successfully.',
            transactionId: mainTxId,
        };

    } catch (error: any) {
        console.error('Firestore transaction failed:', error);
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
        
        const accountDoc = await adminDb.doc(`users/${transaction.userId}/bankAccounts/${transaction.fromAccountId}`).get();
        if (!accountDoc.exists) {
             throw new Error("Account for transaction not found.");
        }
        const accountData = accountDoc.data() as Account;


        const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate proof of payment:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
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
      // --- READ PHASE ---
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

      // --- WRITE PHASE ---
      
      // 1. Create a log in failedTransactions
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

      // 2. Create a new credit transaction to represent the return
      const returnTxRef = adminDb.collection(`users/${userId}/bankAccounts/${accountId}/transactions`).doc();
      const returnTxData: Transaction = {
          id: returnTxRef.id,
          userId: userId,
          fromAccountId: accountId,
          amount: txData.amount, // Credit the same amount
          type: 'credit',
          transactionType: 'EFT_STANDARD', // Or a new 'RETURN' type if defined
          date: new Date().toISOString(),
          description: `RETURN: ${txData.description}`,
          recipientName: 'SELF',
      };
      firestoreTransaction.set(returnTxRef, returnTxData);
      
      // 3. Update the account balance by adding the amount back
      const newBalance = accountData.balance + txData.amount;
      firestoreTransaction.update(accountRef, { balance: newBalance });

      // 4. The original transaction is NOT deleted. It remains as a record.
    });

    revalidatePath(`/account/${accountId}`);
    revalidatePath(`/account/${accountId}/transaction/${transactionId}`);
    return { success: true, message: 'Transaction successfully marked as returned and funds reversed.' };
  } catch (error: any) {
    console.error('Failed to mark transaction as failed:', error);
    return { success: false, message: error.message || 'Failed to mark transaction as failed.' };
  }
}

export async function sendProofOfPaymentEmailAction(
  transaction: Transaction,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!transaction) throw new Error("Transaction data is required.");
    if (!recipientEmail) throw new Error("Recipient email is required.");
    
    const functions = getFunctions();
    const sendEmailFn = httpsCallable(functions, 'sendEmail');

    // Generate the PDF
    const pdfResult = await generateProofOfPaymentAction(transaction);
    if ('error' in pdfResult) {
      throw new Error(pdfResult.error);
    }
    const pdfBytes = pdfResult;
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    const subject = `Proof of Payment from VAN SCHALKWYK FAMILY TRUST - Ref: ${transaction.popReferenceNumber}`;
    const html = `
        <p>Dear ${transaction.recipientName || 'Valued Customer'},</p>
        <p>Please find attached the proof of payment for the amount of ${formatCurrency(transaction.amount, 'ZAR')}.</p>
        <p><b>Reference:</b> ${transaction.recipientReference || 'N/A'}</p>
        <p>Thank you,</p>
        <p><b>VAN SCHALKWYK FAMILY TRUST</b></p>
    `;

    // Call the Cloud Function
    await sendEmailFn({
      to: recipientEmail,
      subject: subject,
      html: html,
      attachments: [{
        filename: `proof-of-payment-${transaction.id}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf',
      }]
    });

    return { success: true, message: "Email sent successfully." };
  } catch (error: any) {
    console.error("Failed to send proof of payment email:", error);
    return { success: false, message: error.message || "An unknown error occurred." };
  }
}

export async function sendProofOfPaymentSmsAction(
  transaction: Transaction,
  recipientNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!transaction) throw new Error("Transaction data is required.");
    if (!recipientNumber) throw new Error("Recipient phone number is required.");
    
    const functions = getFunctions();
    const sendSmsFn = httpsCallable(functions, 'sendSms');

    const text = `Nedbank: Proof of payment for ${formatCurrency(transaction.amount, 'ZAR')} to ${transaction.recipientName || 'recipient'} on ${format(new Date(transaction.date), 'dd/MM/yyyy')}. Ref: ${transaction.popReferenceNumber}`;

    await sendSmsFn({ to: recipientNumber, text });

    return { success: true, message: "SMS sent successfully." };
  } catch (error: any) {
    console.error("Failed to send proof of payment SMS:", error);
    return { success: false, message: error.message || "An unknown error occurred." };
  }
}


const FormSchema = z.object({
  income: z.coerce
    .number()
    .positive({ message: 'Please enter a positive number for your income.' }),
  spendingHabits: z.string().min(10, { message: 'Please describe your spending habits in a bit more detail.' }),
  budget: z.string().min(10, { message: 'Please describe your budget in a bit more detail.' }),
});

export async function getFinancialTipsAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = FormSchema.safeParse({
    income: formData.get('income'),
    spendingHabits: formData.get('spendingHabits'),
    budget: formData.get('budget'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Get Tips.',
      data: null,
    };
  }

  try {
    const tips = await getPersonalizedFinancialTips(validatedFields.data);
    return {
        message: 'Success! Here are your personalized tips.',
        errors: {},
        data: tips,
    };
  } catch (error) {
    console.error('Error getting financial tips:', error);
    return {
        message: 'An error occurred while getting your financial tips. Please try again.',
        errors: {},
        data: null,
    };
  }
}
